/**
 * Camada de persistência — Supabase externo (TCC).
 * Tabelas: profiles, user_roles, registros_manobra, indicadores.
 */
import { supabase } from "@/integrations/supabase/client";

export type Cargo = string;

export interface Operador {
  id: string;
  nome: string;
  matricula: string;
  cargo: Cargo;
}

export type StatusManobra = "liberada" | "verificacao" | "bloqueada" | "emergencia";

export interface RegistroManobra {
  id: string;
  operador: Omit<Operador, "id">;
  dataHora: string;
  status: StatusManobra;
  aptidao: Record<string, boolean>;
  area: Record<string, boolean>;
  comunicacao: Record<string, boolean>;
  motivosBloqueio: string[];
  emergencia?: boolean;
}

export interface Indicadores {
  diasSemAcidentes: number;
  diasSemInvasao: number;
}

/* ============ AUTH ============ */

let operadorCache: Operador | null = null;
let operadorRequest: Promise<Operador | null> | null = null;
const OPERADOR_CACHE_KEY = "zsm:operador";

function isOperador(value: unknown): value is Operador {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Record<keyof Operador, unknown>>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.nome === "string" &&
    typeof candidate.matricula === "string" &&
    typeof candidate.cargo === "string"
  );
}

function readStoredOperador(): Operador | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(OPERADOR_CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isOperador(parsed) ? parsed : null;
  } catch {
    window.sessionStorage.removeItem(OPERADOR_CACHE_KEY);
    return null;
  }
}

function setOperadorCache(operador: Operador): void {
  operadorCache = operador;
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(OPERADOR_CACHE_KEY, JSON.stringify(operador));
}

export function getCachedOperador(): Operador | null {
  if (operadorCache) return operadorCache;
  operadorCache = readStoredOperador();
  return operadorCache;
}

export function clearOperadorCache(): void {
  operadorCache = null;
  operadorRequest = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(OPERADOR_CACHE_KEY);
  }
}

export async function getOperador(): Promise<Operador | null> {
  const cached = getCachedOperador();
  if (cached) return cached;
  if (operadorRequest) return operadorRequest;

  operadorRequest = loadOperador().finally(() => {
    operadorRequest = null;
  });

  return operadorRequest;
}

async function loadOperador(): Promise<Operador | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) {
    clearOperadorCache();
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, nome, matricula, cargo")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  const operador = data as Operador;
  setOperadorCache(operador);
  return operador;
}

/**
 * O TCC define identificação por Matrícula (não email). Como o Supabase Auth
 * exige email, geramos um email interno determinístico a partir da matrícula.
 * O usuário vê e usa apenas a matrícula.
 */
function matriculaToEmail(matricula: string): string {
  return `${matricula.trim().toLowerCase()}@zsm.local`;
}

export async function signIn(matricula: string, password: string): Promise<void> {
  clearOperadorCache();
  const { error } = await supabase.auth.signInWithPassword({
    email: matriculaToEmail(matricula),
    password,
  });
  if (error) throw new Error("Matrícula ou senha inválida");
  await getOperador();
}

export async function signUp(params: {
  password: string;
  nome: string;
  matricula: string;
  cargo: string;
}): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: matriculaToEmail(params.matricula),
    password: params.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        nome: params.nome,
        matricula: params.matricula,
        cargo: params.cargo,
      },
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      throw new Error("Esta matrícula já está cadastrada");
    }
    throw new Error(error.message);
  }
}

export async function signOut(): Promise<void> {
  clearOperadorCache();
  await supabase.auth.signOut();
}

/* ============ REGISTROS ============ */

interface DbRegistro {
  id: string;
  operador_nome: string;
  operador_matricula: string;
  operador_cargo: string;
  data_hora: string;
  status: StatusManobra;
  aptidao: Record<string, boolean>;
  area: Record<string, boolean>;
  comunicacao: Record<string, boolean>;
  motivos_bloqueio: string[];
  emergencia: boolean;
}

function mapRegistro(r: DbRegistro): RegistroManobra {
  return {
    id: r.id,
    operador: {
      nome: r.operador_nome,
      matricula: r.operador_matricula,
      cargo: r.operador_cargo,
    },
    dataHora: r.data_hora,
    status: r.status,
    aptidao: r.aptidao ?? {},
    area: r.area ?? {},
    comunicacao: r.comunicacao ?? {},
    motivosBloqueio: r.motivos_bloqueio ?? [],
    emergencia: r.emergencia,
  };
}

export async function getRegistros(): Promise<RegistroManobra[]> {
  const { data, error } = await supabase
    .from("registros_manobra")
    .select(
      "id, operador_nome, operador_matricula, operador_cargo, data_hora, status, aptidao, area, comunicacao, motivos_bloqueio, emergencia",
    )
    .order("data_hora", { ascending: false })
    .limit(500);
  if (error) {
    console.error("getRegistros", error);
    return [];
  }
  return (data as DbRegistro[]).map(mapRegistro);
}

export interface NovoRegistro {
  status: StatusManobra;
  aptidao: Record<string, boolean>;
  area: Record<string, boolean>;
  comunicacao: Record<string, boolean>;
  motivosBloqueio: string[];
  emergencia?: boolean;
}

export async function saveRegistro(input: NovoRegistro): Promise<RegistroManobra> {
  const op = await getOperador();
  if (!op) throw new Error("Operador não autenticado");

  const { data, error } = await supabase
    .from("registros_manobra")
    .insert({
      operador_id: op.id,
      operador_nome: op.nome,
      operador_matricula: op.matricula,
      operador_cargo: op.cargo,
      status: input.status,
      aptidao: input.aptidao,
      area: input.area,
      comunicacao: input.comunicacao,
      motivos_bloqueio: input.motivosBloqueio,
      emergencia: input.emergencia ?? false,
    })
    .select(
      "id, operador_nome, operador_matricula, operador_cargo, data_hora, status, aptidao, area, comunicacao, motivos_bloqueio, emergencia",
    )
    .single();

  if (error) throw new Error(error.message);
  return mapRegistro(data as DbRegistro);
}

/* ============ INDICADORES ============ */

export async function getIndicadores(): Promise<Indicadores> {
  const { data, error } = await supabase
    .from("indicadores")
    .select("dias_sem_acidentes, dias_sem_invasao")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return { diasSemAcidentes: 0, diasSemInvasao: 0 };
  return {
    diasSemAcidentes: data.dias_sem_acidentes ?? 0,
    diasSemInvasao: data.dias_sem_invasao ?? 0,
  };
}
