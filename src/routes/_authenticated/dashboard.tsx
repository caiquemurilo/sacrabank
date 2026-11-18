import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, CreditCard, Landmark, Link2, PiggyBank, MessageSquareText } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { brl, consolidatedBalance, monthRange, summarize, type Account, type Transaction } from "@/lib/finance";

const financeQuery = queryOptions({
  queryKey: ["finance"],
  queryFn: async () => {
    const [a, t] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("occurred_on", { ascending: false }).limit(500),
    ]);
    if (a.error) throw a.error;
    if (t.error) throw t.error;
    return { accounts: a.data as Account[], transactions: t.data as Transaction[] };
  },
});

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — SacraBank" },
      { name: "description", content: "Saldo, entradas, saídas e gastos por categoria." },
      { property: "og:title", content: "Painel — SacraBank" },
      { property: "og:description", content: "Seu painel financeiro SacraBank." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(financeQuery),
  component: Dashboard,
});

const accIcon = { corrente: Landmark, poupanca: PiggyBank, cartao: CreditCard } as Record<string, typeof Landmark>;
const fmtDate = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function Dashboard() {
  const { data } = useSuspenseQuery(financeQuery);
  const { start, end } = monthRange();
  const month = data.transactions.filter((t) => t.occurred_on >= start && t.occurred_on <= end);
  const s = summarize(month);
  const total = consolidatedBalance(data.accounts);
  const chartColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Saldo consolidado</p>
          <h1 className="text-4xl font-semibold md:text-5xl">{brl(total)}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast("Em breve: conexão com seu banco.")}>
            <Link2 className="size-4" /> Conectar banco
          </Button>
          <Button asChild>
            <Link to="/assistente"><MessageSquareText className="size-4 text-gold" /> Perguntar ao Sacra AI</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Entradas do mês" value={s.income} icon={ArrowUpRight} tone="text-positive" />
        <Stat label="Saídas do mês" value={s.expenses} icon={ArrowDownRight} tone="text-negative" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="text-lg font-semibold">Contas e cartões</h2>
          <ul className="mt-4 space-y-3">
            {data.accounts.map((a) => {
              const Icon = accIcon[a.type] ?? Landmark;
              return (
                <li key={a.id} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                  <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><Icon className="size-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.institution}</p>
                  </div>
                  <p className={`font-semibold tabular-nums ${a.balance < 0 ? "text-negative" : ""}`}>{brl(Number(a.balance))}</p>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="rounded-xl border bg-card p-5 shadow-card lg:col-span-3">
          <h2 className="text-lg font-semibold">Gastos por categoria <span className="text-sm font-normal text-muted-foreground">· este mês</span></h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.categories} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" width={100} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip formatter={(v) => brl(Number(v))} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {s.categories.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]!} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="text-lg font-semibold">Transações recentes</h2>
        <ul className="mt-3 divide-y">
          {data.transactions.slice(0, 10).map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <span className="w-14 text-xs text-muted-foreground">{fmtDate(t.occurred_on)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.merchant ?? t.description}</p>
                <p className="text-xs text-muted-foreground">{t.category}</p>
              </div>
              <span className={`font-semibold tabular-nums ${t.amount < 0 ? "" : "text-positive"}`}>
                {t.amount > 0 ? "+" : ""}{brl(Number(t.amount))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Landmark; tone: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label} <Icon className={`size-4 ${tone}`} />
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone}`}>{brl(value)}</p>
    </div>
  );
}
