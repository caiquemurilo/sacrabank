import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolOutput } from "@/components/ai-elements/tool";

export const Route = createFileRoute("/_authenticated/assistente")({
  head: () => ({
    meta: [
      { title: "Sacra AI — SacraBank" },
      { name: "description", content: "Pergunte ao Sacra AI sobre seu saldo e seus gastos." },
      { property: "og:title", content: "Sacra AI — SacraBank" },
      { property: "og:description", content: "Assistente financeiro com IA do SacraBank." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assistant,
});

const toolLabels: Record<string, string> = {
  consultar_saldo: "Consultando saldo",
  resumir_transacoes: "Resumindo transações",
  buscar_gastos: "Buscando gastos",
};
const suggestions = ["Quanto eu tenho?", "Quanto entrou e saiu neste mês?", "Quais foram meus maiores gastos?", "Quanto gastei com iFood?", "Em que categoria estou gastando mais?"];

function Assistant() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const headers = new Headers(init?.headers);
          if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (e) => toast.error(e.message?.includes("402") ? "Créditos de IA esgotados." : "Não foi possível responder agora. Tente novamente."),
  });
  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => { if (text.trim() && !busy) sendMessage({ text }); };

  return (
    <main className="mx-auto flex h-[calc(100vh-72px)] max-w-3xl flex-col px-4 pb-4">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="grid size-12 place-items-center rounded-xl bg-primary font-display text-xl text-gold">S</div>
              <h1 className="mt-3 text-2xl font-semibold">Olá, eu sou o Sacra AI</h1>
              <p className="text-sm text-muted-foreground">Pergunte sobre seu saldo e seus gastos. Só leio seus dados — nunca movimento dinheiro.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border bg-card px-3 py-1.5 text-sm hover:border-gold">{s}</button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.parts.map((p, i) => {
                    if (p.type === "text")
                      return m.role === "user" ? <span key={i}>{p.text}</span> : <MessageResponse key={i}>{p.text}</MessageResponse>;
                    if (isToolUIPart(p)) {
                      const name = p.type.replace(/^tool-/, "");
                      return (
                        <Tool key={i} defaultOpen={false}>
                          {p.type === "dynamic-tool" ? (
                            <ToolHeader type={p.type} state={p.state} toolName={p.toolName} title={toolLabels[p.toolName] ?? p.toolName} />
                          ) : (
                            <ToolHeader type={p.type} state={p.state} title={toolLabels[name] ?? name} />
                          )}
                          <ToolContent>
                            <ToolOutput output={p.output} errorText={p.errorText} />
                          </ToolContent>
                        </Tool>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <p className="animate-pulse text-sm text-muted-foreground">Sacra AI está analisando…</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput onSubmit={({ text }) => send(text)}>
        <PromptInputTextarea autoFocus placeholder="Pergunte sobre suas finanças…" />
        <PromptInputFooter className="justify-end">
          <PromptInputSubmit status={status} onStop={stop} />
        </PromptInputFooter>
      </PromptInput>
    </main>
  );
}
