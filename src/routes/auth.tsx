import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "signup" } =>
    s["mode"] === "signup" ? { mode: "signup" } : {},
  head: () => ({
    meta: [
      { title: "Entrar — SacraBank" },
      { name: "description", content: "Acesse ou crie sua conta SacraBank." },
      { property: "og:title", content: "Entrar — SacraBank" },
      { property: "og:description", content: "Acesse ou crie sua conta SacraBank." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [signup, setSignup] = useState(search.mode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = signup
      ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("Invalid login") ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    if (!data.session) {
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-hero-gradient p-10 text-hero-foreground md:flex md:flex-col md:justify-between">
        <Link to="/"><Logo /></Link>
        <p className="font-display text-3xl leading-snug">“Quanto gastei com iFood este mês?”<br /><span className="text-gold">Pergunte ao Sacra AI.</span></p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <Link to="/" className="md:hidden"><Logo /></Link>
          <div>
            <h1 className="text-3xl font-semibold">{signup ? "Criar conta" : "Entrar"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {signup ? "Comece com dados de demonstração." : "Bem-vindo de volta."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}
          </Button>
          <button type="button" onClick={() => setSignup(!signup)} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
            {signup ? "Já tem conta? Entrar" : "Não tem conta? Criar agora"}
          </button>
        </form>
      </div>
    </div>
  );
}
