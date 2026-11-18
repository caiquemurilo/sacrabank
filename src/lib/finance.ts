export type Account = { id: string; name: string; type: string; institution: string; balance: number };
export type Transaction = {
  id: string; account_id: string; occurred_on: string; description: string;
  merchant: string | null; category: string; amount: number;
};

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Saldo consolidado: soma de todas as contas (cartão entra negativo). */
export function consolidatedBalance(accounts: Pick<Account, "balance">[]) {
  return round(accounts.reduce((s, a) => s + Number(a.balance), 0));
}

export function monthRange(ref = new Date(), offset = 0) {
  const start = new Date(ref.getFullYear(), ref.getMonth() + offset, 1);
  const end = new Date(ref.getFullYear(), ref.getMonth() + offset + 1, 0);
  const f = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: f(start), end: f(end) };
}

export function summarize(txs: Pick<Transaction, "amount" | "category">[]) {
  let income = 0, expenses = 0;
  const byCategory: Record<string, number> = {};
  for (const t of txs) {
    const a = Number(t.amount);
    if (a >= 0) income += a;
    else {
      expenses += -a;
      byCategory[t.category] = (byCategory[t.category] ?? 0) - a;
    }
  }
  const categories = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total: round(total) }))
    .sort((x, y) => y.total - x.total);
  return { income: round(income), expenses: round(expenses), net: round(income - expenses), categories };
}

export const round = (n: number) => Math.round(n * 100) / 100;
