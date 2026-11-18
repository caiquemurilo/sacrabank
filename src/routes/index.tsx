import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ShieldCheck, MessageSquareText, PieChart } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SacraBank — Suas finanças com inteligência" },
      { name: "description", content: "Veja saldo, entradas, saídas e gastos por categoria, e pergunte ao Sacra AI sobre seu dinheiro." },
      { property: "og:title", content: "SacraBank — Suas finanças com inteligência" },
      { property: "og:description", content: "Dashboard financeiro e assistente Sacra AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-hero-gradient text-hero-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Button asChild variant="ghost" className="text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-28">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold">Assistente financeiro com IA</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
          Seu dinheiro, claro como nunca. Pergunte e o <span className="text-gold">Sacra AI</span> responde.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-hero-foreground/75">
          Saldo consolidado, entradas e saídas do mês e seus maiores gastos — tudo em um só lugar.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-gold text-accent-foreground hover:bg-gold/90">
            <Link to="/auth" search={{ mode: "signup" }}>Criar conta</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-hero-foreground/30 bg-transparent text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground">
            <Link to="/auth">Já tenho conta</Link>
          </Button>
        </div>
        <div className="mt-24 grid gap-6 md:grid-cols-3">
          {[
            { icon: PieChart, t: "Visão completa", d: "Contas, cartões e gastos por categoria." },
            { icon: MessageSquareText, t: "Sacra AI", d: "Pergunte “quanto gastei com iFood?” e receba o valor exato." },
            { icon: ShieldCheck, t: "Somente leitura", d: "O assistente nunca movimenta seu dinheiro." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-xl border border-hero-foreground/10 bg-hero-foreground/5 p-6">
              <Icon className="size-5 text-gold" />
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-hero-foreground/70">{d}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
