import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, LogOut, MessageSquareText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const link = "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-hero-foreground/75 hover:bg-hero-foreground/10 hover:text-hero-foreground";
  return (
    <div className="min-h-screen">
      <header className="bg-hero text-hero-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/dashboard"><Logo /></Link>
          <nav className="flex items-center gap-1">
            <Link to="/dashboard" className={link} activeProps={{ className: "bg-hero-foreground/10 text-hero-foreground" }}>
              <LayoutDashboard className="size-4" /> Painel
            </Link>
            <Link to="/assistente" className={link} activeProps={{ className: "bg-hero-foreground/10 text-hero-foreground" }}>
              <MessageSquareText className="size-4 text-gold" /> Sacra AI
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-hero-foreground/75 hover:bg-hero-foreground/10 hover:text-hero-foreground">
              <LogOut className="size-4" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
