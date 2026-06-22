import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";


import { EmergencyButton } from "@/components/EmergencyButton";
import { getRegistroStatusLabel } from "@/components/StatusIndicator";
import {
  getIndicadores,
  getOperador,
  getRegistros,
  saveRegistro,
  type RegistroManobra,
  type StatusManobra,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel — Zona Segura de Manobra" },
      {
        name: "description",
        content:
          "Painel operacional de manobras ferroviárias com indicadores de segurança e parada de emergência.",
      },
      { property: "og:title", content: "Zona Segura de Manobra" },
      {
        property: "og:description",
        content: "Sistema de validação de manobras ferroviárias.",
      },
    ],
  }),
  component: DashboardPage,
});

const STATUS_LABEL: Record<StatusManobra, string> = {
  liberada: "Liberada",
  verificacao: "Em Verificação",
  bloqueada: "Bloqueada",
};

const STATUS_TEXT: Record<StatusManobra, string> = {
  liberada: "text-success",
  verificacao: "text-warning",
  bloqueada: "text-danger",
};

interface PainelCache {
  registros: RegistroManobra[];
  status: StatusManobra;
  indicadores: { diasSemAcidentes: number; diasSemInvasao: number };
  loaded: boolean;
}

const painelCache: PainelCache = {
  registros: [],
  status: "verificacao",
  indicadores: { diasSemAcidentes: 0, diasSemInvasao: 0 },
  loaded: false,
};

function DashboardPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [registros, setRegistros] = useState<RegistroManobra[]>(painelCache.registros);
  const [status, setStatus] = useState<StatusManobra>(painelCache.status);
  const [indicadores, setIndicadoresState] = useState(painelCache.indicadores);

  const refresh = async (): Promise<void> => {
    const [all, ind] = await Promise.all([getRegistros(), getIndicadores()]);
    const nextStatus = all[0]?.status ?? "verificacao";
    painelCache.registros = all;
    painelCache.status = nextStatus;
    painelCache.indicadores = ind;
    painelCache.loaded = true;
    setRegistros(all);
    setStatus(nextStatus);
    setIndicadoresState(ind);
  };

  useEffect(() => {
    if (ready) void refresh();
  }, [ready]);




  const stats = useMemo(() => {
    const total = registros.length;
    const liberadas = registros.filter((r) => r.status === "liberada").length;
    const emergencias = registros.filter((r) => r.emergencia).length;
    const bloqueadas = registros.filter((r) => r.status === "bloqueada" && !r.emergencia).length;
    const conformidade = total === 0 ? 100 : Math.round((liberadas / total) * 100);
    return { total, liberadas, bloqueadas, emergencias, conformidade };
  }, [registros]);
  const registroAtual = registros[0];

  const handleEmergencia = async (): Promise<void> => {
    const op = await getOperador();
    if (!op) {
      router.navigate({ to: "/auth" });
      return;
    }
    await saveRegistro({
      status: "bloqueada",
      aptidao: {},
      area: {},
      comunicacao: {},
      motivosBloqueio: ["MANOBRA INTERROMPIDA POR CONDIÇÃO INSEGURA"],
      emergencia: true,
    });
    setStatus("bloqueada");
    await refresh();
  };

  const iniciar = async (): Promise<void> => {
    const op = await getOperador();
    router.navigate({ to: op ? "/manobra" : "/auth" });
  };

  if (!ready) return null;

  return (

    <div className="min-h-screen bg-background">

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-12 lg:px-8">
        {/* === COLUNA ESQUERDA: STATUS + KPIs === */}
        <div className="space-y-4 sm:space-y-6 lg:col-span-8">
          {/* Bloco de status — Command Mobile */}
          <section className="overflow-hidden border-2 border-border bg-card lg:border-4">
            <div className="hazard-stripes h-2 w-full" aria-hidden />
            <div className="flex items-center gap-4 p-4 sm:gap-6 sm:p-6 lg:p-8">
              <TrafficLight active={status} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:text-xs">
                  Status do Sistema
                </p>
                <h2
                  className={cn(
                    "mt-1 break-words text-3xl font-bold uppercase leading-none tracking-tighter sm:text-5xl lg:text-7xl",
                    STATUS_TEXT[status],
                  )}
                >
                  {registroAtual ? getRegistroStatusLabel(registroAtual) : STATUS_LABEL[status]}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full animate-status-blink",
                      STATUS_TEXT[status].replace("text-", "bg-"),
                    )}
                    aria-hidden
                  />
                  <p className="truncate text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs lg:text-sm">
                    {registroAtual
                      ? `${registroAtual.operador.nome} · ${registroAtual.operador.cargo}`
                      : "Monitoramento em tempo real"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTAs principais — visíveis em mobile, ocultos em lg (aside cuida) */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            <button
              type="button"
              onClick={iniciar}
              className="w-full border-b-4 border-primary/60 bg-primary py-5 text-lg font-bold uppercase tracking-tighter text-primary-foreground transition-all active:translate-y-1 active:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Iniciar Nova Manobra
            </button>
            <EmergencyButton onTrigger={handleEmergencia} />
          </div>

          {/* Grid de indicadores — divisor estilo Command */}
          <section className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
            <Kpi label="Dias sem acidentes" value={indicadores.diasSemAcidentes} />
            <Kpi label="Dias sem invasão" value={indicadores.diasSemInvasao} />
            <Kpi label="Conformidade" value={stats.conformidade} unit="%" accent />
            <Kpi label="Manobras realizadas" value={stats.total} />
            <Kpi label="Liberadas" value={stats.liberadas} valueClass="text-success" />
            <Kpi label="Bloqueadas" value={stats.bloqueadas} valueClass="text-danger" />
            <Kpi label="Emergências" value={stats.emergencias} valueClass="text-danger" />
          </section>

          {/* Últimas operações — condensado para mobile */}
          <div className="border border-border bg-card p-3 sm:p-4 lg:hidden">
            <h3 className="mb-2 border-b border-border pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              Últimas Operações
            </h3>
            {registros.length === 0 ? (
              <p className="py-4 text-center text-[11px] uppercase tracking-wider text-muted-foreground">
                Nenhum registro
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {registros.slice(0, 5).map((r) => (
                  <li key={r.id} className="py-2">
                    <OperacaoCompact registro={r} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2 border-t border-border pt-2 text-right">
              <Link
                to="/historico"
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Ver tudo →
              </Link>
            </div>
          </div>

          <div className="hazard-stripes h-2 w-full lg:hidden" aria-hidden />
        </div>

        {/* === COLUNA DIREITA: AÇÕES + HISTÓRICO (apenas desktop) === */}
        <aside className="hidden flex-col gap-6 lg:flex lg:col-span-4">
          <button
            type="button"
            onClick={iniciar}
            className="w-full border-b-4 border-primary/60 bg-primary py-6 text-2xl font-bold uppercase tracking-tighter text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Iniciar Nova Manobra
          </button>

          <EmergencyButton onTrigger={handleEmergencia} />

          <div className="flex-1 border border-border bg-card p-4">
            <h3 className="mb-4 border-b border-border pb-2 text-xs uppercase tracking-widest text-muted-foreground">
              Últimas Operações
            </h3>
            {registros.length === 0 ? (
              <p className="py-6 text-center text-xs uppercase tracking-wider text-muted-foreground">
                Nenhum registro
              </p>
            ) : (
              <ul className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 320 }}>
                {registros.slice(0, 8).map((r) => (
                  <li key={r.id}>
                    <OperacaoRow registro={r} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 border-t border-border pt-3 text-right">
              <Link
                to="/historico"
                className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                Ver tudo →
              </Link>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

/* ============================ Subcomponentes ============================ */

interface KpiProps {
  label: string;
  value: number;
  unit?: string;
  accent?: boolean;
  valueClass?: string;
}

function Kpi({ label, value, unit, accent, valueClass }: KpiProps) {
  return (
    <div className="border-l-4 border-primary bg-card p-3 sm:p-4">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums sm:text-4xl",
          accent && "text-primary",
          valueClass,
        )}
      >
        {value}
        {unit && (
          <span className="ml-1 text-xs text-muted-foreground sm:text-sm">{unit}</span>
        )}
      </p>
    </div>
  );
}

function OperacaoCompact({ registro }: { registro: RegistroManobra }) {
  const statusText =
    registro.emergencia
      ? "text-danger"
      : registro.status === "liberada"
      ? "text-success"
      : registro.status === "bloqueada"
        ? "text-danger"
        : "text-warning";
  const horario = new Date(registro.dataHora).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-bold uppercase tracking-tight text-foreground">
          {registro.operador.nome.split(" ")[0]} · {horario}
        </p>
      </div>
      <span className={cn("shrink-0 text-[10px] font-bold uppercase tracking-widest", statusText)}>
        {getRegistroStatusLabel(registro)}
      </span>
    </div>
  );
}

function TrafficLight({ active }: { active: StatusManobra }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Lamp on={active === "bloqueada"} color="danger" />
      <Lamp on={active === "verificacao"} color="warning" />
      <Lamp on={active === "liberada"} color="success" />
    </div>
  );
}

function Lamp({
  on,
  color,
}: {
  on: boolean;
  color: "danger" | "warning" | "success";
}) {
  const onClasses = {
    danger: "bg-danger border-foreground shadow-[0_0_30px_rgba(220,38,38,0.6)]",
    warning: "bg-warning border-foreground shadow-[0_0_30px_rgba(234,179,8,0.6)]",
    success: "bg-success border-foreground shadow-[0_0_30px_rgba(34,197,94,0.6)]",
  } as const;
  return (
    <span
      className={cn(
        "block h-14 w-14 rounded-full border-4 sm:h-16 sm:w-16",
        on ? onClasses[color] : "border-border bg-secondary",
        on && "animate-status-blink",
      )}
    />
  );
}

function OperacaoRow({ registro }: { registro: RegistroManobra }) {
  const borderColor =
    registro.emergencia
      ? "border-danger"
      : registro.status === "liberada"
      ? "border-success"
      : registro.status === "bloqueada"
        ? "border-danger"
        : "border-warning";
  const statusText =
    registro.emergencia
      ? "text-danger"
      : registro.status === "liberada"
      ? "text-success"
      : registro.status === "bloqueada"
        ? "text-danger"
        : "text-warning";
  const horario = new Date(registro.dataHora).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div
      className={cn(
        "flex items-center justify-between border-l-2 bg-background p-3",
        borderColor,
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
          {registro.operador.nome.split(" ")[0]} · {registro.operador.cargo}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {horario}
        </p>
      </div>
      <span
        className={cn("text-xs font-bold uppercase tracking-widest", statusText)}
      >
        {getRegistroStatusLabel(registro)}
      </span>
    </div>
  );
}
