import { Link, useRouter } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  clearOperadorCache,
  getCachedOperador,
  getOperador,
  signOut,
  type Operador,
} from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const router = useRouter();
  const [operador, setOperadorState] = useState<Operador | null>(() => getCachedOperador());

  useEffect(() => {
    const cached = getCachedOperador();
    if (cached) setOperadorState(cached);
    else void getOperador().then(setOperadorState);

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) {
        clearOperadorCache();
        setOperadorState(null);
        return;
      }

      const current = getCachedOperador();
      if (current) setOperadorState(current);
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
      <div className="mx-auto flex min-h-[88px] w-full max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/painel" className="flex shrink-0 items-center gap-3">
          <span className="skew-badge inline-block bg-primary px-3 py-1 text-xl font-bold text-primary-foreground sm:text-2xl">
            ZSM
          </span>
        </Link>

        <nav className="order-3 flex w-full flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-widest text-muted-foreground sm:text-sm lg:order-2 lg:w-auto lg:gap-6">
          <NavLink to="/painel">Monitoramento</NavLink>
          <NavLink to="/manobra">Nova Manobra</NavLink>
          <NavLink to="/historico">Histórico</NavLink>
        </nav>

        <div className="order-2 flex shrink-0 items-center gap-2 sm:gap-3 lg:order-3">
          {operador ? (
            <>
              <div className="flex min-w-0 items-center gap-2 border border-border bg-card px-3 py-2 sm:gap-3 sm:px-4">
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-success animate-status-blink"
                  aria-hidden
                />
                <span className="truncate text-[10px] font-bold uppercase tracking-widest text-foreground sm:text-xs">
                  {operador.nome.split(" ")[0]} {operador.nome.split(" ").slice(-1)[0]?.[0] ?? ""}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} aria-label="Sair">
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
