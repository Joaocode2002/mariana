import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface EmergencyButtonProps {
  onTrigger: () => void;
  className?: string;
  /** Tempo (ms) que o botão precisa ser mantido pressionado. Default 3000. */
  holdMs?: number;
}

/**
 * Botão de Emergência — Hold-to-Confirm.
 * O operador precisa MANTER pressionado por `holdMs` (default 3s) para disparar.
 * Soltar antes cancela. Evita disparos acidentais e funciona em touch + mouse.
 */
export function EmergencyButton({ onTrigger, className, holdMs = 3000 }: EmergencyButtonProps) {
  const [progress, setProgress] = useState<number>(0);
  const [holding, setHolding] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const firedRef = useRef<boolean>(false);

  const cancel = (): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHolding(false);
    setProgress(0);
    firedRef.current = false;
  };

  const tick = (): void => {
    const elapsed = performance.now() - startRef.current;
    const pct = Math.min(100, (elapsed / holdMs) * 100);
    setProgress(pct);
    if (pct >= 100) {
      if (!firedRef.current) {
        firedRef.current = true;
        onTrigger();
      }
      cancel();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const start = (): void => {
    if (holding) return;
    setHolding(true);
    firedRef.current = false;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && !e.repeat) start();
      }}
      onKeyUp={cancel}
      className={cn(
        "group relative flex w-full select-none items-center justify-center gap-4 overflow-hidden border-4 border-danger bg-card p-4 transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger",
        className,
      )}
      aria-label="Parada de emergência — mantenha pressionado por 3 segundos"
    >
      <span className="absolute left-0 top-0 h-1 w-full bg-danger" aria-hidden />
      {/* Barra de progresso do hold */}
      <span
        className="absolute bottom-0 left-0 h-2 bg-danger transition-none"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger transition-transform group-hover:scale-110">
        <span className="block h-6 w-6 rounded-full border-4 border-danger-foreground" />
      </span>
      <span className="flex flex-col items-start text-left">
        <span className="text-2xl font-bold uppercase tracking-tighter text-danger group-hover:text-danger/80">
          {holding ? `Segure... ${Math.ceil((holdMs - (progress / 100) * holdMs) / 1000)}s` : "Emergência"}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {holding ? "Continue pressionando" : "Mantenha pressionado por 3s"}
        </span>
      </span>
    </button>
  );
}
