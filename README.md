# Zona Segura de Manobra

Sistema web para validação de manobras ferroviárias com checklists de aptidão, inspeção da área, comunicação operacional, painel de indicadores e parada de emergência.

## Stack

- React 19 + TypeScript
- TanStack Start (SSR) + TanStack Router + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth + Postgres + RLS)

---

## 🚀 Deploy no Vercel (recomendado)

Este projeto já vem configurado para Vercel — o TanStack Start detecta a Vercel automaticamente via Nitro e gera as serverless functions.

### Passo a passo

1. **Suba o código num repositório Git** (GitHub, GitLab ou Bitbucket).

2. **Crie um projeto no Supabase** em https://supabase.com e rode as migrations da pasta `supabase/migrations/`:
   ```bash
   # Opção A: via Supabase CLI
   supabase link --project-ref seu-project-ref
   supabase db push

   # Opção B: copie e cole cada .sql no SQL Editor do dashboard
   ```

3. **No painel do Supabase**, copie:
   - `Project URL` → vira `VITE_SUPABASE_URL` e `SUPABASE_URL`
   - `anon public` key → vira `VITE_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_PUBLISHABLE_KEY`

4. **Em Authentication → URL Configuration**, adicione a URL do seu domínio Vercel (ex: `https://seu-app.vercel.app`) em **Site URL** e em **Redirect URLs**.

5. **No Vercel** → "New Project" → importe o repo:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build` (já configurado em `vercel.json`)
   - **Output Directory**: deixe vazio (Nitro gera `.vercel/output` automaticamente)
   - **Install Command**: `npm install`

6. **Adicione as Environment Variables** no Vercel (Project Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_PUBLISHABLE_KEY=sua-chave-anon
   ```

7. **Deploy** → o Vercel detecta o output do Nitro automaticamente e provisiona as serverless functions.

---

## 💻 Desenvolvimento local

```bash
# 1. Instale deps
npm install

# 2. Copie o .env.example e preencha
cp .env.example .env

# 3. Rode dev server
npm run dev
```

Abre em `http://localhost:8080`.

---

## 🏗️ Build local de produção

```bash
npm run build
# o output fica em .output/ (Node) ou .vercel/output/ (Vercel)
```

---

## 📁 Estrutura

```
src/
  routes/          # Rotas (file-based routing do TanStack Router)
  components/      # Componentes React + shadcn/ui
  lib/             # storage, utils, error handling
  integrations/    # Cliente Supabase
  hooks/           # React hooks
  styles.css       # Tailwind v4 + tokens semânticos
supabase/
  migrations/      # SQL para criar tabelas, RLS, triggers
```

---

## ✨ Funcionalidades

- Login com nome, matrícula e cargo (Maquinista, Manobrista, Supervisor, Manutenção)
- Checklist de Aptidão (5 perguntas)
- Checklist da Área (7 perguntas)
- Checklist de Comunicação (4 perguntas)
- Liberação com countdown de 10s e animação de giroflex/sirene
- Botão de Parada de Emergência (hold 3 segundos)
- Painel de indicadores: dias sem acidentes, dias sem invasão, manobras realizadas/bloqueadas, emergências, conformidade %
- Histórico com filtros por status (Todas/Liberadas/Bloqueadas/Emergências) e período (Hoje/Semana/Mês)
- Tema laranja/preto/branco industrial ferroviário
- Responsivo mobile-first
