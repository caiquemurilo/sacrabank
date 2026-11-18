// Pure mapping from Pluggy objects to SacraBank's schema (entrada > 0, saída < 0).

export type PluggyAccount = {
  id: string;
  type?: string | null; // BANK | CREDIT
  subtype?: string | null; // CHECKING_ACCOUNT | SAVINGS_ACCOUNT | CREDIT_CARD
  name?: string | null;
  marketingName?: string | null;
  balance?: number | null;
};

export type PluggyTransaction = {
  id: string;
  date?: string | null;
  description?: string | null;
  descriptionRaw?: string | null;
  amount?: number | null;
  type?: string | null; // DEBIT | CREDIT
  category?: string | null;
  merchant?: { name?: string | null; businessName?: string | null } | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

export function accountType(a: PluggyAccount): "corrente" | "poupanca" | "cartao" {
  if (a.type === "CREDIT" || a.subtype === "CREDIT_CARD") return "cartao";
  if (a.subtype === "SAVINGS_ACCOUNT") return "poupanca";
  return "corrente";
}

export function normalizeAccount(a: PluggyAccount, institution: string) {
  const type = accountType(a);
  const raw = Number(a.balance ?? 0) || 0;
  return {
    external_id: a.id,
    name: (a.marketingName || a.name || "Conta").trim(),
    type,
    institution: institution || "Pluggy",
    // Cartão entra negativo no saldo consolidado (fatura em aberto).
    balance: r2(type === "cartao" ? -Math.abs(raw) : raw),
  };
}

export function signedAmount(t: PluggyTransaction, accountIsCard: boolean) {
  const raw = Number(t.amount ?? 0) || 0;
  if (t.type === "DEBIT") return r2(-Math.abs(raw));
  if (t.type === "CREDIT") return r2(Math.abs(raw));
  // Sem tipo: no cartão a Pluggy usa positivo = compra.
  return r2(accountIsCard ? -raw : raw);
}

const CATEGORY_RULES: [RegExp, string][] = [
  [/salary|sal[aá]rio/i, "Salário"],
  [/groceries|supermarket|mercado/i, "Mercado"],
  [/food|eating|restaurant|delivery|aliment/i, "Alimentação"],
  [/taxi|ride|transport|gas station|fuel|parking|tolls|mobility|combust/i, "Transporte"],
  [/rent|housing|aluguel|moradia/i, "Moradia"],
  [/utilit|electric|water|telecom|internet|phone|contas/i, "Contas"],
  [/streaming|digital services|subscription|assinatura/i, "Assinaturas"],
  [/health|pharmac|gym|fitness|sa[uú]de/i, "Saúde"],
  [/leisure|entertainment|travel|lazer/i, "Lazer"],
  [/shopping|online|electronics|clothing|compras/i, "Compras"],
  [/interest|yield|rendiment|investment income/i, "Rendimentos"],
  [/income|entrada/i, "Renda extra"],
];

export function mapCategory(category: string | null | undefined, amount: number) {
  if (category) for (const [re, label] of CATEGORY_RULES) if (re.test(category)) return label;
  return amount >= 0 ? "Outras entradas" : "Outros";
}

export function normalizeTransaction(t: PluggyTransaction, accountIsCard: boolean) {
  const amount = signedAmount(t, accountIsCard);
  const date = (t.date ?? "").slice(0, 10);
  const merchant = (t.merchant?.businessName || t.merchant?.name || "").trim() || null;
  return {
    external_id: t.id,
    occurred_on: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10),
    description: (t.description || t.descriptionRaw || "Transação").trim(),
    merchant,
    category: mapCategory(t.category, amount),
    amount,
  };
}
