import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Radio } from "lucide-react";

import { EmergencyButton } from "@/components/EmergencyButton";
import { SignaturePad } from "@/components/SignaturePad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  getCachedOperador,
  getOperador,
  saveRegistro,
  type Operador,
  type RegistroManobra,
} from "@/lib/storage";

export const Route = createFileRoute("/manobra")({
  head: () => ({
    meta: [
      { title: "Nova Manobra — Zona Segura de Manobra" },
      {
        name: "description",
        content: "Execute o checklist de aptidão, inspeção da área e comunicação operacional.",
      },
    ],
  }),
  component: ManobraPage,
});

interface ChecklistItem {
  id: string;
  pergunta: string;
}

const APTIDAO: ChecklistItem[] = [
  { id: "apto_fisico", pergunta: "Você está apto fisicamente para realizar a atividade?" },
  { id: "epi", pergunta: "Está utilizando todos os EPIs obrigatórios?" },
  { id: "dds", pergunta: "Participou do DDS?" },
  { id: "riscos", pergunta: "Compreendeu os riscos da atividade?" },
  { id: "treinamento", pergunta: "Possui treinamento para executar a manobra?" },
];

const AREA: ChecklistItem[] = [
  { id: "inspecao", pergunta: "Área inspecionada?" },
  { id: "via", pergunta: "Via liberada?" },
  { id: "zona_risco", pergunta: "Não existem pessoas na zona de risco?" },
  { id: "giroflex", pergunta: "Giroflex funcionando?" },
  { id: "sirenes", pergunta: "Sirenes funcionando?" },
  { id: "radio", pergunta: "Rádio testado?" },
  { id: "sinalizacao", pergunta: "Sinalização ativa?" },
];

const COMUNICACAO: ChecklistItem[] = [
  { id: "maquinista", pergunta: "Maquinista comunicado?" },
  { id: "manobrista", pergunta: "Manobrista comunicado?" },
  { id: "manutencao", pergunta: "Equipe de manutenção comunicada?" },
  { id: "supervisor", pergunta: "Supervisor ciente da operação?" },
];

type Step = "aptidao" | "area" | "comunicacao" | "assinatura" | "resultado";
type Respostas = Record<string, boolean>;

function ManobraPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [operador, setOperadorState] = useState<Operador | null>(() => getCachedOperador());
  const [step, setStep] = useState<Step>("aptidao");
  const [aptidao, setAptidao] = useState<Respostas>({});
  const [area, setArea] = useState<Respostas>({});
  const [comunicacao, setComunicacao] = useState<Respostas>({});
  const [assinatura, setAssinatura] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState<{ motivo: string; etapa: string } | null>(null);
  const [autorizado, setAutorizado] = useState<RegistroManobra | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  const [emergenciaOpen, setEmergenciaOpen] = useState(false);
  const [emergenciaAssinatura, setEmergenciaAssinatura] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    const cached = getCachedOperador();
    if (cached) {
      setOperadorState(cached);
      return;
    }

    void getOperador().then((op) => {
      if (!op) {
        router.navigate({ to: "/auth" });
        return;
      }
      setOperadorState(op);
    });
  }, [ready, router]);

  useEffect(() => {
    if (!autorizado) return;
    if (countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [autorizado, countdown]);

  const progresso = useMemo(() => {
    if (step === "aptidao") return 20;
    if (step === "area") return 40;
    if (step === "comunicacao") return 60;
    if (step === "assinatura") return 80;
    return 100;
  }, [step]);

  if (!ready) return null;

  const avaliar = (
    items: ChecklistItem[],
    respostas: Respostas,
    etapa: string,
    isEmergencia = false,
  ): { ok: boolean; motivo?: string } => {
    // Se for emergência, não valida as respostas negativas (permite pular)
    if (isEmergencia) return { ok: true };
    
    for (const item of items) {
      if (respostas[item.id] !== true) {
        return { ok: false, motivo: `${etapa}: "${item.pergunta}"` };
      }
    }
    return { ok: true };
  };

  const handleNextAptidao = (): void => {
    const r = avaliar(APTIDAO, aptidao, "Aptidão do Trabalhador");
    if (!r.ok) {
      void bloquear(r.motivo!, "aptidao");
      return;
    }
    setStep("area");
  };

  const handleNextArea = (): void => {
    const r = avaliar(AREA, area, "Área de Manobra");
    if (!r.ok) {
      void bloquear(r.motivo!, "area");
      return;
    }
    setStep("comunicacao");
  };

  const handleNextComunicacao = (): void => {
    const r = avaliar(COMUNICACAO, comunicacao, "Comunicação Operacional");
    if (!r.ok) {
      void bloquear(r.motivo!, "comunicacao");
      return;
    }
    setStep("assinatura");
  };

  const handleFinalizar = async (): Promise<void> => {
    if (!assinatura) return;
    const registro = await saveRegistro({
      status: "liberada",
      aptidao,
      area,
      comunicacao,
      motivosBloqueio: [],
    });
    setAutorizado(registro);
    setCountdown(10);
    setStep("resultado");
  };


  const bloquear = async (motivo: string, etapa: Step, isEmergencia = false): Promise<void> => {
    await saveRegistro({
      status: "bloqueada",
      aptidao,
      area,
      comunicacao,
      motivosBloqueio: [motivo],
      emergencia: isEmergencia,
    });
    setBloqueado({ motivo, etapa });
    setStep("resultado");
  };

  const handleEmergencia = (): void => {
    setEmergenciaAssinatura(null);
    // Abre no próximo tick para não colidir com o pointerup do "hold-to-confirm",
    // evitando que o Radix Dialog interprete como interação externa e feche.
    setTimeout(() => setEmergenciaOpen(true), 50);
  };

  const confirmarEmergencia = async (): Promise<void> => {
    if (!emergenciaAssinatura) return;
    await saveRegistro({
      status: "bloqueada",
      aptidao,
      area,
      comunicacao,
      motivosBloqueio: ["PARADA DE EMERGÊNCIA ACIONADA"],
      emergencia: true,
    });
    setEmergenciaOpen(false);
    setBloqueado({
      motivo: "PARADA DE EMERGÊNCIA ACIONADA",
      etapa: "emergencia",
    });
    setAutorizado(null);
    setStep("resultado");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {operador ? (
                <>
                  Operador: {operador.nome} · {operador.cargo}
                </>
              ) : (
                <span className="invisible">Operador: —</span>
              )}
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
              Validação de Manobra
            </h1>
            <div
              className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progresso}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          {step === "aptidao" && (
            <ChecklistSection
              title="1. Aptidão do Trabalhador"
              items={APTIDAO}
              respostas={aptidao}
              onChange={setAptidao}
              onNext={handleNextAptidao}
            />
          )}
          {step === "area" && (
            <ChecklistSection
              title="2. Inspeção da Área de Manobra"
              items={AREA}
              respostas={area}
              onChange={setArea}
              onNext={handleNextArea}
            />
          )}
          {step === "comunicacao" && (
            <ChecklistSection
              title="3. Comunicação Operacional"
              items={COMUNICACAO}
              respostas={comunicacao}
              onChange={setComunicacao}
              onNext={handleNextComunicacao}
              nextLabel="Ir para assinatura"
            />
          )}
          {step === "assinatura" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-foreground">4. Assinatura Digital</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ao assinar, você confirma que executou o checklist e assume a
                  responsabilidade pela manobra.
                </p>
                <SignaturePad onChange={setAssinatura} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setStep("comunicacao")}>
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    size="lg"
                    disabled={!assinatura}
                    onClick={() => void handleFinalizar()}
                  >
                    Finalizar e autorizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "resultado" && bloqueado && (
            <Card className="border-danger bg-danger/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-danger">
                  <AlertTriangle className="h-7 w-7" />
                  {bloqueado.etapa === "emergencia"
                    ? "MANOBRA INTERROMPIDA"
                    : "Operação não autorizada"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-foreground">{bloqueado.motivo}</p>
                {bloqueado.etapa !== "emergencia" && (
                  <p className="text-sm text-muted-foreground">
                    Solicite o acionamento do supervisor imediatamente.
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => router.navigate({ to: "/painel" })} variant="outline">
                    Voltar ao painel
                  </Button>
                  <Button
                    onClick={() => {
                      setBloqueado(null);
                      setAptidao({});
                      setArea({});
                      setComunicacao({});
                      setAssinatura(null);
                      setStep("aptidao");
                    }}
                  >
                    Reiniciar checklist
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === "resultado" && autorizado && !bloqueado && (
            <Card className="border-success bg-success/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-success">
                  <CheckCircle2 className="h-7 w-7" />
                  MANOBRA AUTORIZADA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-6">
                  <div
                    className="flex h-32 w-32 items-center justify-center rounded-full bg-primary animate-giroflex"
                    aria-label="Giroflex em operação"
                  >
                    <Radio className="h-12 w-12 text-primary-foreground animate-siren" />
                  </div>
                  <p className="text-center text-6xl font-black tabular-nums text-foreground">
                    {countdown}s
                  </p>
                  <p className="text-sm uppercase tracking-widest text-muted-foreground">
                    {countdown > 0 ? "Iniciando manobra" : "Manobra em andamento"}
                  </p>
                </div>
                <div className="grid gap-2 rounded-lg bg-card p-4 text-sm">
                  <p>
                    <span className="text-muted-foreground">Responsável:</span>{" "}
                    <strong className="text-foreground">{autorizado.operador.nome}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Cargo:</span>{" "}
                    <strong className="text-foreground">{autorizado.operador.cargo}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Data/Hora:</span>{" "}
                    <strong className="text-foreground">
                      {new Date(autorizado.dataHora).toLocaleString("pt-BR")}
                    </strong>
                  </p>
                </div>
                <Button onClick={() => router.navigate({ to: "/painel" })} className="w-full">
                  Voltar ao painel
                </Button>
              </CardContent>
            </Card>
          )}

          {step !== "resultado" && <EmergencyButton onTrigger={handleEmergencia} />}
        </div>
      </main>

      <Dialog
        open={emergenciaOpen}
        onOpenChange={(o) => {
          setEmergenciaOpen(o);
          if (!o) setEmergenciaAssinatura(null);
        }}
      >
        <DialogContent
          className="border-danger"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Parada de Emergência
            </DialogTitle>
            <DialogDescription>
              Esta ação será registrada como interrupção por condição insegura. Assine
              abaixo para confirmar a responsabilidade.
            </DialogDescription>
          </DialogHeader>
          <SignaturePad onChange={setEmergenciaAssinatura} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEmergenciaOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!emergenciaAssinatura}
              onClick={() => void confirmarEmergencia()}
            >
              Confirmar emergência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ChecklistSectionProps {
  title: string;
  items: ChecklistItem[];
  respostas: Respostas;
  onChange: (next: Respostas) => void;
  onNext: () => void;
  onJump?: () => void;
  nextLabel?: string;
}

function ChecklistSection({
  title,
  items,
  respostas,
  onChange,
  onNext,
  onJump,
  nextLabel = "Próxima etapa",
}: ChecklistSectionProps) {
  const todasRespondidas = items.every((i) => typeof respostas[i.id] === "boolean");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <fieldset
            key={item.id}
            className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <legend className="sr-only">{item.pergunta}</legend>
            <p className="text-sm font-medium text-foreground">{item.pergunta}</p>
            <div className="flex gap-2">
              <YesNoButton
                active={respostas[item.id] === true}
                tone="success"
                onClick={() => onChange({ ...respostas, [item.id]: true })}
              >
                SIM
              </YesNoButton>
              <YesNoButton
                active={respostas[item.id] === false}
                tone="danger"
                onClick={() => onChange({ ...respostas, [item.id]: false })}
              >
                NÃO
              </YesNoButton>
            </div>
          </fieldset>
        ))}
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onNext} disabled={!todasRespondidas} size="lg" className="w-full">
            {nextLabel} <ChevronRight className="ml-1 h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface YesNoButtonProps {
  active: boolean;
  tone: "success" | "danger";
  onClick: () => void;
  children: React.ReactNode;
}

function YesNoButton({ active, tone, onClick, children }: YesNoButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-w-20 rounded-md border-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !active && "border-border bg-card text-muted-foreground hover:border-foreground",
        active && tone === "success" && "border-success bg-success text-success-foreground",
        active && tone === "danger" && "border-danger bg-danger text-danger-foreground",
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
