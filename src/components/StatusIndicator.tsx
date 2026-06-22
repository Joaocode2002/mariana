import { cn } from "@/lib/utils";
import type { RegistroManobra, StatusManobra } from "@/lib/storage";

interface StatusIndicatorProps {
  status: StatusManobra;
  emergencia?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LABELS: Record<StatusManobra, string> = {
  liberada: "Manobra Liberada",
  verificacao: "Verificação em Andamento",
  bloqueada: "Manobra Bloqueada",
};

const COLOR: Record<StatusManobra, string> = {
  liberada: "bg-success text-success-foreground",
  verificacao: "bg-warning text-warning-foreground",
  bloqueada: "bg-danger text-danger-foreground",
};

export function getRegistroStatusLabel(
  registro: Pick<RegistroManobra, "status" | "emergencia">,
): string {
  return registro.emergencia ? "Parada de Emergência" : LABELS[registro.status];
}

const DOT: Record<"sm" | "md" | "lg", string> = {
  sm: "h-2 w-2",
  md: "h-3 w-3",
  lg: "h-4 w-4",
};

const TEXT: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[10px] px-2 py-1",
  md: "text-xs px-3 py-1.5",
  lg: "text-sm px-4 py-2",
};

export function StatusIndicator({
  status,
  emergencia = false,
  size = "md",
  className,
}: StatusIndicatorProps) {
  const label = getRegistroStatusLabel({ status, emergencia });

  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2 font-bold uppercase tracking-widest",
        COLOR[status],
        TEXT[size],
        className,
      )}
    >
      <span
        className={cn("rounded-full bg-current animate-status-blink", DOT[size])}
        aria-hidden
      />
      {label}
    </span>
  );
}
