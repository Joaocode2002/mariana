import { Link, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getOperador, signOut, type Operador } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const router = useRouter();
  const [operador, setOperadorState] = useState<Operador | null>(null);

  useEffect(() => {
    void getOperador().then(setOperadorState);
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) setOperadorState(null);
      else void getOperador().then(setOperadorState);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async (): Promise<void> => {
    await signOut();
    setOperadorState(null);
    router.navigate({ to: "/auth" });
  };

  return (
    <header className="border-b-4 border-primary bg-background">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-4">
        <div className="flex items-center justify-between gap-3 lg:contents">
          <Link to="/painel" className="flex min-w-0 items-center gap-3">
            <span className="skew-badge inline-block shrink-0 bg-primary px-3 py-1 text-xl font-bold text-primary-foreground sm:text-2xl">
              ZSM
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 lg:order-last">
            {operador ? (
              <>
                <div className="flex min-w-0 items-center gap-2 border border-border bg-card px-3 py-2 sm:gap-3 sm:px-4">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-success animate-status-blink"
                    aria-hidden
                  />
                  <span className="truncate text-[10px] font-bold uppercase tracking-widest text-foreground sm:text-xs">
                    {operador.nome.split(" ")[0]}{" "}
                    {operador.nome.split(" ").slice(-1)[0]?.[0] ?? ""}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Entrar</Link>
              </Button>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-widest text-muted-foreground sm:gap-6 sm:text-sm">
          <NavLink to="/painel">Monitoramento</NavLink>
          <NavLink to="/manobra">Nova Manobra</NavLink>
          <NavLink to="/historico">Histórico</NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="border-b-2 border-transparent pb-1 transition-all hover:border-primary hover:text-primary"
      activeProps={{ className: "border-primary text-primary" }}
      activeOptions={{ exact: to === "/" }}
    >
      {children}
    </Link>
  );
}
