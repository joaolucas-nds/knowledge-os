# CHANGELOG

> Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).
> **Cresce no topo.** Registra só o que foi de fato concluído/entregue.

---

## [0.3.0] — 2026-06-29
### Adicionado
- `apps/web`: login via Supabase Auth — página `/login`, Server Actions `signIn`/`signOut`, `lib/supabase/client.ts` e `lib/supabase/server.ts`.
- `apps/web/proxy.ts`: renovação automática de sessão + redirecionamento de rotas protegidas (substitui o que seria `middleware.ts` — ver DEC-015).
- `apps/web/app/auth/callback/route.ts`: troca de code por sessão (suporte futuro a magic link/OAuth).
- `apps/api/src/auth/plugin.ts`: verificação de JWT do Supabase (HS256/Legacy Secret) via `@fastify/jwt`; decorator `requireAuth` para proteger rotas.
- `apps/api`: rota `/me` de diagnóstico, protegida por `requireAuth` — testada via HTTP real (não só simulação).
- `packages/db/src/client.ts`: detecção automática de SSL por host (`shouldUseSsl`) — Supabase e qualquer host remoto usam SSL automaticamente, localhost não.

### Corrigido
- FIX-002: conflito de module augmentation entre `@fastify/jwt` e tipagem própria de `request.user` — corrigido usando o ponto de extensão correto da lib (`FastifyJWT` interface).

### Decidido
- DEC-014: verificação de JWT via HS256/Legacy Secret (não JWKS); Session mode pooler (porta 5432) em vez de Transaction mode (6543), tanto para `apps/api` quanto para migrations.
- DEC-015: `proxy.ts` desde o início (não `middleware.ts`) — Next.js 16 renomeou a convenção; descoberto no primeiro build de validação.

---

## [0.2.0] — 2026-06-26
### Alterado
- **Pivô arquitetural:** modelo passa de Local-First+CRDT (multi-dispositivo offline) para Online-First single-user (Postgres no Supabase como única fonte de verdade) — ver DEC-011. Decisão do usuário: uso é só por uma pessoa, sem requisito de edição offline.
- `packages/db/src/schema.ts`: removida a coluna `crdt_state` (obsoleta) — nova migration gerada e validada contra Postgres real.
- `README.md`, `CONTEXT.md`, `GLOSSARY.md`: atualizados para refletir o modelo online-first (Supabase, Vercel) em vez do Local-First original.

### Removido
- `packages/crdt` — esqueleto de Automerge removido do monorepo (não chegou a ser usado em produção).

### Decidido
- DEC-011: modelo online-first single-user substitui Local-First + CRDT (supera DEC-003 e DEC-004).
- DEC-012: Supabase como provedor de Postgres + Auth + Storage; Fastify mantido como camada de API.
- DEC-013: Vercel para o frontend (Cloudflare Pages avaliado e descartado).

### Adicionado
- `SETUP.md`: guia de criação de conta/projeto no Supabase (substitui a versão anterior, sobre PostgreSQL local).

---

## [0.1.0] — 2026-06-24
### Adicionado
- Monorepo Turborepo + pnpm workspaces criado e funcional: `apps/web`, `apps/api`, `packages/db`, `packages/crdt`, `packages/ui` (ver DEC-008).
- TypeScript strict em todos os workspaces; `pnpm typecheck` (turbo) passa limpo nos 5.
- ESLint flat config em todos os workspaces; `pnpm lint` passa com zero warnings (ver DEC-010 sobre a divisão de versões do ESLint).
- Schema Drizzle inicial (`blocks`, `relations`) em `packages/db` — migration gerada e **aplicada contra um Postgres 16 real**, com smoke test de insert+select validado.
- `apps/api`: Fastify 5 com `/health` e `/health/db` (CORS + rate limit registrados). Testado ao vivo contra Postgres real.
- `apps/web`: Next.js 16 (Turbopack) com home page que valida a conexão web↔api ao vivo. Build de produção e dev server testados de ponta a ponta.
- `.github/workflows/ci.yml`: CI básico (typecheck + lint) no GitHub Actions.
- `packages/crdt` e `packages/ui`: esqueletos com dependências já resolvidas (`@automerge/automerge`, `react`), reservando o lugar para F5 e F2 respectivamente.

### Corrigido
- FIX-001: `apps/api` não carregava o `.env` (DATABASE_URL nunca chegava ao processo) — corrigido com a flag nativa `--env-file-if-exists` do Node 22.

### Decidido
- DEC-008: pnpm como gerenciador de pacotes do monorepo.
- DEC-009: atualização da stack de Next.js 15 → 16 (15 já estava obsoleto no dia da implementação).
- DEC-010: ESLint ^9 em `apps/web` (compatibilidade com `eslint-config-next`), ^10 nos demais workspaces.

---

## [Não lançado]
### Adicionado
- Arquitetura completa de banco de dados: schema SQL com `blocks`, `relations`, `canvas_nodes`, `canvas_edges`, `database_schemas`, `search_vectors`.
- Arquitetura do canvas infinito: integração tldraw v3, frustum culling RBush, LOD, pathfinding A* para edges.
- Arquitetura de busca global: Orama (client-side) + FTS5 (SQLite offline) + pgvector (semântico backend) + RRF fusion.
- Árvore de componentes React do canvas: 10 componentes documentados com props, hooks e fluxo de dados (CanvasApp, CanvasShell, CanvasView, NoteShapeUtil, DatabaseShapeUtil, CanvasEdges, CanvasToolbar, NodeInspector, SearchPalette, Sidebar).
- Diagrama interativo de arquitetura de componentes (HTML widget navegável + SVG de camadas).
- Benchmark de 14 ferramentas do mercado com análise de modelo de preço, pontos fortes e fracos.
- Stack tecnológica definida e justificada (7 decisões arquiteturais em DECISIONS.md).
- ROADMAP de desenvolvimento em 6 fases (F0 Fundação → F6 Grafo + Busca Semântica).
- Documentação completa do projeto (CONTEXT, STATUS, DECISIONS, ROADMAP, GLOSSARY, HISTORICO, IDEAS, logs).

---

## [0.0.0] — 2026-06-05
### Adicionado
- Início do projeto: planejamento e arquitetura completa definida em sessão inaugural.
