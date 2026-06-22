import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Train,
  ShieldCheck,
  ListChecks,
  AlertOctagon,
  BarChart3,
  Radio,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Zona Segura de Manobra — Segurança ferroviária operacional" },
      {
        name: "description",
        content:
          "Sistema de validação de manobras ferroviárias com checklists de aptidão, inspeção da área, comunicação operacional e parada de emergência.",
      },
      { property: "og:title", content: "Zona Segura de Manobra" },
      {
        property: "og:description",
        content:
          "Garante que nenhuma locomotiva seja movimentada sem validação completa das condições de segurança.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: ListChecks,
    title: "Checklist em 3 etapas",
    desc: "Aptidão do trabalhador, inspeção da área e comunicação operacional antes de cada manobra.",
  },
  {
    icon: ShieldCheck,
    title: "Bloqueio automático",
    desc: "Qualquer resposta negativa interrompe a operação e registra o motivo do bloqueio.",
  },
  {
    icon: AlertOctagon,
    title: "Parada de emergência",
    desc: "Botão dedicado que interrompe imediatamente a manobra em caso de condição insegura.",
  },
  {
    icon: BarChart3,
    title: "Indicadores de segurança",
    desc: "Dias sem acidentes, taxa de conformidade e histórico completo de manobras realizadas.",
  },
  {
    icon: Radio,
    title: "Rastreabilidade",
    desc: "Cada manobra registra operador, matrícula, cargo, data, hora e respostas dos checklists.",
  },
  {
    icon: Train,
    title: "Foco ferroviário",
    desc: "Projetado para o ambiente industrial ferroviário, reduzindo falhas humanas em manobras.",
  },
] as const;

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header simples */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Train className="h-5 w-5" aria-hidden />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider sm:text-base">
              Zona Segura de Manobra
            </span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90 sm:text-sm"
          >
            Acessar sistema
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="hazard-stripes h-2 w-full" aria-hidden />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Segurança Ferroviária Operacional
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Nenhuma locomotiva se move <br className="hidden sm:block" />
            sem validação completa
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            O Zona Segura de Manobra digitaliza o protocolo de segurança ferroviária,
            garantindo que toda manobra passe por checklists obrigatórios de aptidão,
            inspeção da área e comunicação operacional antes de ser autorizada.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Entrar no sistema
            </Link>
            <a
              href="#funcionalidades"
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-6 py-3 text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-accent"
            >
              Conhecer mais
            </a>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Funcionalidades
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Um protocolo digital completo que substitui formulários em papel e elimina
            a movimentação de locomotivas sem validação prévia.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <article
              key={title}
              className="group border-2 border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 text-primary">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="text-base font-bold uppercase tracking-wide text-foreground">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
            Pronto para começar?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Acesse com sua matrícula ou cadastre um novo operador.
          </p>
          <Link
            to="/auth"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Acessar sistema
          </Link>
        </div>
        <div className="hazard-stripes h-2 w-full" aria-hidden />
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Zona Segura de Manobra — Projeto TCC
      </footer>
    </div>
  );
}
