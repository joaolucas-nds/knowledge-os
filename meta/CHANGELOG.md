# CHANGELOG

> Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/) e versionamento [SemVer](https://semver.org/lang/pt-BR/).
> **Cresce no topo.** Registra só o que foi de fato concluído/entregue.

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
