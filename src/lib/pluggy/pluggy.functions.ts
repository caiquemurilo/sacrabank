import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createConnectToken, getItem, listAccounts, listTransactions, pluggyApiKey } from "./pluggy.server";
import { normalizeAccount, normalizeTransaction } from "./normalize";

/** Connect Token para abrir o Pluggy Connect; amarrado ao usuário autenticado. */
export const getPluggyConnectToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const apiKey = await pluggyApiKey();
    return { connectToken: await createConnectToken(apiKey, context.userId) };
  });

/** Importa (somente leitura) contas e transações do item para o usuário autenticado. */
export const syncPluggyItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ itemId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const userId = context.userId;
    const apiKey = await pluggyApiKey();
    const item = await getItem(apiKey, data.itemId);
    // O item precisa ter sido criado com o Connect Token deste usuário.
    if (item.clientUserId !== userId) throw new Error("Conexão não pertence a este usuário.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const existing = await supabaseAdmin.from("pluggy_items").select("user_id").eq("item_id", item.id).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data && existing.data.user_id !== userId) throw new Error("Conexão não pertence a este usuário.");

    const institution = item.connector?.name ?? "Pluggy";
    const up = await supabaseAdmin
      .from("pluggy_items")
      .upsert({ user_id: userId, item_id: item.id, connector_name: institution, status: item.status ?? null }, { onConflict: "item_id" });
    if (up.error) throw up.error;

    const pAccounts = await listAccounts(apiKey, item.id);
    if (pAccounts.length === 0) return { accounts: 0, transactions: 0 };

    const accRes = await supabaseAdmin
      .from("accounts")
      .upsert(pAccounts.map((a) => ({ ...normalizeAccount(a, institution), user_id: userId })), { onConflict: "user_id,external_id" })
      .select("id, external_id, type");
    if (accRes.error) throw accRes.error;
    const byExternal = new Map(accRes.data.map((a) => [a.external_id, a]));

    let txCount = 0;
    for (const pa of pAccounts) {
      const acc = byExternal.get(pa.id);
      if (!acc) continue;
      const rows = (await listTransactions(apiKey, pa.id)).map((t) => ({
        ...normalizeTransaction(t, acc.type === "cartao"),
        user_id: userId,
        account_id: acc.id,
      }));
      for (let i = 0; i < rows.length; i += 500) {
        const r = await supabaseAdmin.from("transactions").upsert(rows.slice(i, i + 500), { onConflict: "user_id,external_id" });
        if (r.error) throw r.error;
      }
      txCount += rows.length;
    }
    return { accounts: accRes.data.length, transactions: txCount };
  });
