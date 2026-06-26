# STATUS.md — Estado Atual

> Arquivo **rolante**: descreve só o AGORA. O assistente lê no início para saber onde retomar.
> Item resolvido SAI daqui — vai para o CHANGELOG (se foi entrega) e/ou para o log da sessão.
> Médio e longo prazo NÃO ficam aqui — ficam no ROADMAP.

---

## Versão Atual
**[0.1.0]** — 2026-06-24 — primeiro código real do projeto. F0 (Fundação Técnica) parcialmente concluída e validada de ponta a ponta contra um Postgres real.

## ✅ Funcionando (validado de fato, não só "parece certo")
- **Monorepo Turborepo + pnpm** criado e funcional: `apps/web`, `apps/api`, `packages/db`, `packages/crdt`, `packages/ui` — todos com TypeScript strict.
- **`pnpm typecheck`** (turbo, 5 workspaces) — ✅ passa limpo.
- **`pnpm lint`** (ESLint flat config, 5 workspaces, `--max-warnings=0`) — ✅ passa limpo. `apps/web` usa `eslint-config-next` (ESLint ^9); os demais usam ESLint ^10 (ver DEC-010).
- **`packages/db`** — schema Drizzle inicial (`blocks`, `relations`, escopo da F0 — ver ROADMAP). Migration gerada (`drizzle/0000_shiny_gertrude_yorkes.sql`) e **aplicada contra um Postgres 16 real**; smoke test de insert+select via Drizzle passou.
- **`apps/api`** — Fastify 5 com `/health` e `/health/db`. Testado ao vivo: `/health/db` retorna `"ok"` com o Postgres real rodando (ver FIX-001 sobre o bug de `.env` corrigido no caminho).
- **`apps/web`** — Next.js 16 (Turbopack) com home page (Server Component) que busca `/health` da API ao vivo e mostra o status. `next build` de produção testado e passou. Dev server testado ao vivo: renderizou "✓ apps/api respondeu" com a API real rodando.
- **CI** (`.github/workflows/ci.yml`) — typecheck + lint via GitHub Actions, ainda não testado em um push real (só localmente, comando a comando).
- **`packages/crdt`** e **`packages/ui`** — esqueletos intencionais (sem lógica real ainda), compilando e lintando limpo. Dependências já resolvidas e fixadas (`@automerge/automerge`, `react`).

## 🔧 Em Progresso (resta da F0)
- **wa-sqlite + OPFS no browser** — não iniciado. É o próximo passo desta fase.
- **Autenticação (Better Auth ou Clerk)** — não iniciado, ainda não decidido qual dos dois.
- **"Primeiro Block criado e persistido localmente"** (critério de conclusão da F0) — só foi validado no Postgres do backend, não no SQLite local-first do browser (que depende do item acima).

## ❌ Quebrado / Com Problema
- Nenhum bug aberto. O único bug encontrado nesta sessão (apps/api não carregava `.env`) foi corrigido e validado — ver FIX-001 em DECISIONS.md.

## 📋 Backlog (curto prazo — itens acionáveis)
- [ ] Setup wa-sqlite + OPFS no browser (Worker, WAL mode — decidir VFS específico, provavelmente `AccessHandlePoolVFS`, ao implementar).
- [ ] Decidir Better Auth vs. Clerk e implementar login/logout.
- [ ] Primeira tela real de criação de Block (substituindo o card de health-check da home page).
- [ ] Validar o workflow de CI num push real ao GitHub (criado mas não exercitado).
- [ ] Revisitar DEC-004 (Automerge) com a API real da v3.x quando a F5 chegar — `packages/crdt` hoje é só esqueleto.

## 📁 Arquivos Críticos (não mexer sem contexto)
- `packages/db/src/schema.ts` — schema Drizzle compartilhado; qualquer mudança exige nova migration (`pnpm --filter @knowledge-os/db db:generate`) em todos os ambientes.
- `packages/db/drizzle/` — migrations já geradas e aplicadas; não editar arquivos `.sql` já commitados à mão — gerar uma nova migration para qualquer mudança.
- `apps/api/src/env.ts` — única porta de entrada das variáveis de ambiente da API; depende de `--env-file-if-exists` nos scripts `dev`/`start` do `package.json` (ver FIX-001) para funcionar em dev.
- `pnpm-workspace.yaml` — contém `allowBuilds:` (aprovação de scripts nativos de esbuild/sharp/unrs-resolver); não remover essa seção ou instalações futuras voltam a travar.

## 💬 Última Sessão
**2026-06-24** — Implementação real da F0: monorepo Turborepo+pnpm criado, 5 workspaces com TS strict + ESLint. Schema Drizzle (blocks+relations) migrado e testado contra Postgres real. API Fastify com health checks (bug de `.env` encontrado e corrigido — FIX-001). Next.js 16 (não 15 — ver DEC-009) validado com build de produção e dev server real conversando com a API. CI básico criado. Próximo passo: wa-sqlite+OPFS no browser.
