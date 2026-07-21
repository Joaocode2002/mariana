import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Train, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { signIn, signUp } from "@/lib/storage";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso — Zona Segura de Manobra" },
      { name: "description", content: "Acesso do operador ferroviário." },
    ],
  }),
  component: AuthPage,
});

const CARGOS = ["Maquinista", "Manobrista", "Supervisor", "Manutenção"] as const;

const loginSchema = z.object({
  matricula: z
    .string()
    .trim()
    .min(2, "Informe a matrícula")
    .max(20, "A matrícula deve ter no máximo 20 caracteres"),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

const signupSchema = loginSchema.extend({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome completo")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  cargo: z.enum(CARGOS, { message: "Selecione o cargo" }),
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [cargo, setCargo] = useState<string | undefined>(undefined);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setErrMsg("");
    const fd = new FormData(e.currentTarget);
    const base = {
      matricula: String(fd.get("matricula") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    };

    setLoading(true);
    try {
      if (mode === "login") {
        const parsed = loginSchema.safeParse(base);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        await signIn(parsed.data.matricula, parsed.data.password);
      } else {
        const full = {
          ...base,
          nome: String(fd.get("nome") ?? "").trim(),
          cargo: cargo as (typeof CARGOS)[number],
        };
        const parsed = signupSchema.safeParse(full);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        await signUp(parsed.data);
        await signIn(parsed.data.matricula, parsed.data.password);
      }
      router.navigate({ to: "/painel" });
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Train className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground">
            Zona Segura de Manobra
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login" ? "Acesse com sua matrícula" : "Cadastro de operador"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 border border-border bg-card p-6"
          noValidate
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do colaborador</Label>
              <Input id="nome" name="nome" autoComplete="name" required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="matricula">Matrícula</Label>
            <Input
              id="matricula"
              name="matricula"
              autoComplete="username"
              inputMode="text"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={6}
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Select value={cargo} onValueChange={setCargo}>
                <SelectTrigger id="cargo">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {CARGOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {errMsg && (
            <p className="border-l-4 border-danger bg-danger/10 p-2 text-xs text-danger">
              {errMsg}
            </p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Cadastrar e entrar"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setErrMsg("");
            }}
            className="w-full text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            {mode === "login"
              ? "Não tem conta? Cadastrar"
              : "Já tem conta? Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
