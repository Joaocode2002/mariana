import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { StatusIndicator } from "@/components/StatusIndicator";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getRegistros, type RegistroManobra } from "@/lib/storage";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico — Zona Segura de Manobra" },
      {
        name: "description",
        content: "Histórico completo de manobras autorizadas e bloqueadas.",
      },
    ],
  }),
  component: HistoricoPage,
});

type StatusFiltro = "todos" | "liberada" | "bloqueada" | "emergencia";
type PeriodoFiltro = "todos" | "hoje" | "semana" | "mes";

const STATUS_OPCOES: { value: StatusFiltro; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "liberada", label: "Liberadas" },
  { value: "bloqueada", label: "Bloqueadas" },
  { value: "emergencia", label: "Emergências" },
];

const PERIODO_OPCOES: { value: PeriodoFiltro; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

function dentroDoPeriodo(dataISO: string, periodo: PeriodoFiltro): boolean {
  if (periodo === "todos") return true;
  const data = new Date(dataISO);
  const agora = new Date();
  if (periodo === "hoje") {
    return data.toDateString() === agora.toDateString();
  }
  if (periodo === "semana") {
    const semanaMs = 7 * 24 * 60 * 60 * 1000;
    return agora.getTime() - data.getTime() <= semanaMs;
  }
  if (periodo === "mes") {
    return (
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  }
  return true;
}

function HistoricoPage() {
  const { ready } = useRequireAuth();
  const [registros, setRegistros] = useState<RegistroManobra[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>("todos");

  useEffect(() => {
    if (ready) void getRegistros().then(setRegistros);
  }, [ready]);

  const registrosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      if (!dentroDoPeriodo(r.dataHora, periodoFiltro)) return false;
      if (statusFiltro === "todos") return true;
      if (statusFiltro === "emergencia") return r.emergencia === true;
      if (statusFiltro === "bloqueada")
        return r.status === "bloqueada" && !r.emergencia;
      if (statusFiltro === "liberada") return r.status === "liberada";
      return true;
    });
  }, [registros, statusFiltro, periodoFiltro]);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <header>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
            Histórico de Manobras
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {registrosFiltrados.length} de {registros.length} registro(s).
          </p>
        </header>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground self-center mr-1">
              Status:
            </span>
            {STATUS_OPCOES.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={statusFiltro === opt.value ? "default" : "outline"}
                onClick={() => setStatusFiltro(opt.value)}
                className={cn("h-8")}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground self-center mr-1">
              Período:
            </span>
            {PERIODO_OPCOES.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={periodoFiltro === opt.value ? "default" : "outline"}
                onClick={() => setPeriodoFiltro(opt.value)}
                className={cn("h-8")}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {registrosFiltrados.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {registros.length === 0
              ? "Nenhuma manobra registrada ainda."
              : "Nenhum registro corresponde aos filtros selecionados."}
          </p>
        ) : (
          <ul className="space-y-3">
            {registrosFiltrados.map((r) => (
              <li key={r.id}>
                <Card>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">
                        {r.operador.nome}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                          · {r.operador.cargo} · {r.operador.matricula}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.dataHora).toLocaleString("pt-BR")}
                      </p>
                      {r.motivosBloqueio.length > 0 && (
                        <p className="text-xs text-danger">
                          {r.motivosBloqueio.join(" · ")}
                        </p>
                      )}
                    </div>
                    <StatusIndicator status={r.status} emergencia={r.emergencia} size="sm" />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
