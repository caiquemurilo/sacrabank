import { createOpenAI } from "@ai-sdk/openai";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, isStepCount, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { consolidatedBalance, monthRange, round, summarize } from "@/lib/finance";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.server";

const MODEL = "openai/gpt-6-astra";

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

const periodo = z.object({
  inicio: z.string().nullable().describe("Data inicial AAAA-MM-DD, ou null para o mês atual"),
  fim: z.string().nullable().describe("Data final AAAA-MM-DD, ou null para o mês atual"),
});

export async function handleChat(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Não autorizado", { status: 401 });
  const sb = userClient(token);
  const { data: claims, error: authErr } = await sb.auth.getClaims(token);
  if (authErr || !claims?.claims?.sub) return new Response("Não autorizado", { status: 401 });

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("IA não configurada", { status: 500 });

  const { messages } = (await request.json()) as { messages: UIMessage[] };
  const today = new Date().toISOString().slice(0, 10);

  const range = (p: { inicio: string | null; fim: string | null }) => {
    const m = monthRange();
    return { start: p.inicio ?? m.start, end: p.fim ?? m.end };
  };

  const tools = {
    consultar_saldo: tool({
      description: "Retorna as contas/cartões do usuário com saldos e o saldo consolidado.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await sb.from("accounts").select("name,type,institution,balance");
        if (error) throw new Error(error.message);
        return { contas: data, saldo_consolidado: consolidatedBalance(data) };
      },
    }),
    resumir_transacoes: tool({
      description: "Resume transações de um período: total de entradas, saídas, gastos por categoria e as 5 maiores despesas.",
      inputSchema: periodo,
      execute: async (p) => {
        const { start, end } = range(p);
        const { data, error } = await sb.from("transactions")
          .select("occurred_on,description,merchant,category,amount")
          .gte("occurred_on", start).lte("occurred_on", end);
        if (error) throw new Error(error.message);
        const s = summarize(data);
        const maiores = data.filter((t) => t.amount < 0).sort((a, b) => a.amount - b.amount).slice(0, 5);
        return { periodo: { start, end }, quantidade: data.length, entradas: s.income, saidas: s.expenses, saldo_periodo: s.net, gastos_por_categoria: s.categories, maiores_gastos: maiores };
      },
    }),
    buscar_gastos: tool({
      description: "Busca gastos por estabelecimento (ex.: iFood) ou categoria (ex.: Alimentação) num período e retorna o total exato.",
      inputSchema: periodo.extend({
        termo: z.string().describe("Nome do estabelecimento ou categoria"),
      }),
      execute: async (p) => {
        const { start, end } = range(p);
        const term = p.termo.replace(/[%,()]/g, "");
        const { data, error } = await sb.from("transactions")
          .select("occurred_on,description,merchant,category,amount")
          .gte("occurred_on", start).lte("occurred_on", end).lt("amount", 0)
          .or(`merchant.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`)
          .order("occurred_on", { ascending: false });
        if (error) throw new Error(error.message);
        return { periodo: { start, end }, termo: p.termo, quantidade: data.length, total_gasto: round(data.reduce((s, t) => s - t.amount, 0)), transacoes: data };
      },
    }),
  };

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: `Você é o Sacra AI, assistente financeiro do SacraBank. Hoje é ${today}. Responda em português do Brasil, de forma curta e clara, formatando valores em R$.
Regras:
- Use SEMPRE as ferramentas para obter números. Nunca invente, estime ou calcule valores que não venham das ferramentas; prefira os totais retornados.
- Se não houver dados, diga que não encontrou.
- Você tem acesso somente leitura. Recuse educadamente Pix, pagamentos, transferências ou qualquer movimentação financeira.
- Não dê recomendações de investimento ou crédito.`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(6),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({ originalMessages: messages, sendReasoning: false }),
    runIdFetch,
  );
}
