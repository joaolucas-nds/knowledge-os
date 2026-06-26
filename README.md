# Knowledge OS

Ferramenta pessoal de gestão do conhecimento: notas ricas + canvas infinito + tabelas relacionais + busca híbrida. Web-First, Offline-First (local-first — o servidor sincroniza, não é a fonte de verdade).

Arquitetura completa, decisões e roadmap: ver `CONTEXT.md`, `DECISIONS.md` e `ROADMAP.md` na documentação do projeto.

## Status

🟡 **F0 — Fundação Técnica** (em progresso). Ver `STATUS.md` para o estado exato e o que falta nesta fase.

## Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend (`apps/web`):** Next.js 16 (App Router, Turbopack)
- **Backend (`apps/api`):** Fastify 5
- **Banco:** PostgreSQL + Drizzle ORM (`packages/db`)
- **CRDT:** Automerge (`packages/crdt` — esqueleto, implementação real na F5)
- **UI compartilhada:** `packages/ui` — esqueleto, primeiros componentes reais na F2

## Pré-requisitos

- Node.js ≥ 22
- pnpm 11.9.0 (`npm install -g pnpm`, ou deixe o Corepack resolver pelo campo `packageManager`)
- PostgreSQL rodando localmente (ou em Docker) — opcional nesta F0; a API sobe sem banco e reporta isso em `/health/db`

## Setup

```cmd
:: 1. Instalar dependências de todo o monorepo
pnpm install

:: 2. Copiar os .env.example de cada workspace que for usar
copy packages\db\.env.example packages\db\.env
copy apps\api\.env.example apps\api\.env
copy apps\web\.env.example apps\web\.env.local

:: 3. (Opcional nesta F0) Gerar e aplicar migrations do schema
pnpm --filter @knowledge-os/db db:generate
pnpm --filter @knowledge-os/db db:migrate

:: 4. Subir tudo em dev (web + api em paralelo, via Turborepo)
pnpm dev
```

`apps/web` sobe em `http://localhost:3000` e `apps/api` em `http://localhost:3001`. A home page do `apps/web` faz um fetch ao vivo em `/health` da API — se aparecer o card verde, as duas pontas estão conversando corretamente.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `pnpm dev` | Sobe `apps/web` e `apps/api` em paralelo (Turborepo) |
| `pnpm typecheck` | `tsc --noEmit` em todos os workspaces |
| `pnpm lint` | ESLint (flat config) em todos os workspaces |
| `pnpm build` | Build de produção de todos os workspaces |
| `pnpm --filter @knowledge-os/db db:studio` | Abre o Drizzle Studio para inspecionar o banco |

## Estrutura

Ver "Estrutura do Projeto" em `CONTEXT.md` para a árvore completa comentada.
