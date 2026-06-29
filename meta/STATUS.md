# STATUS.md — Estado Atual

> Arquivo **rolante**: descreve só o AGORA. O assistente lê no início para saber onde retomar.
> Item resolvido SAI daqui — vai para o CHANGELOG (se foi entrega) e/ou para o log da sessão.
> Médio e longo prazo NÃO ficam aqui — ficam no ROADMAP.

---

## Versão Atual
**[0.2.0]** — 2026-06-26 — pivô arquitetural: online-first single-user com Supabase, substituindo o plano Local-First + CRDT. Código ajustado e revalidado; falta a integração real com um projeto Supabase de verdade.

## ✅ Funcionando (validado de fato)
- **Monorepo Turborepo + pnpm** com 4 workspaces (`apps/web`, `apps/api`, `packages/db`, `packages/ui`) — `packages/crdt` foi removido (ver DEC-011).
- **`pnpm typecheck`** e **`pnpm lint`** — ✅ passam limpo nos 4 workspaces, revalidados após a remoção do CRDT.
- **`packages/db`** — schema sem a coluna `crdt_state` (removida). Duas migrations agora: criação original + a que remove a coluna. Ambas geradas e **aplicadas com sucesso contra um Postgres real** (local, só para validar a migration — não é mais o destino final).
- **`apps/api`** — Fastify com `/health` e `/health/db`, sem mudanças de comportamento nesta sessão (a troca de Postgres local→Supabase é o próximo passo).
- **`apps/web`** — Next.js 16, sem mudanças de código nesta sessão.

## 🔧 Em Progresso
- **Conta e projeto no Supabase** — guia de criação entregue em SETUP.md; depende de você executar os passos lá (eu não posso criar a conta por você).
- **Integração de código com o Supabase** (próximo passo, depende do item acima): ajuste de SSL no `packages/db/src/client.ts`, variáveis de ambiente novas, login via Supabase Auth no `apps/web`, middleware de verificação de JWT no `apps/api`.
- **Deploy em produção** (Vercel + host do `apps/api`) — planejado para a F5 revisada do ROADMAP, ainda não iniciado.

## ❌ Quebrado / Com Problema
- Nenhum bug aberto.

## 📋 Backlog (curto prazo — itens acionáveis)
- [ ] Você: criar conta/projeto no Supabase (SETUP.md) e ter as credenciais à mão.
- [ ] Eu: adaptar `client.ts` (SSL), `.env.example` (novo formato de `DATABASE_URL`), implementar login Supabase Auth no `apps/web` e middleware de JWT no `apps/api`.
- [ ] Decidir host do `apps/api` para deploy (Render vs. Fly.io) — pendente até a F5 do ROADMAP.
- [ ] Validar Supabase Storage para upload de imagem (ou trocar por R2, se o 1GB grátis não bastar).

## 📁 Arquivos Críticos (não mexer sem contexto)
- `packages/db/src/schema.ts` — schema Drizzle compartilhado; qualquer mudança exige nova migration (`pnpm --filter @knowledge-os/db db:generate`) em todos os ambientes. **Não tem mais coluna `crdt_state`** desde esta sessão.
- `packages/db/drizzle/` — duas migrations já geradas e aplicadas (local, para validação); não editar `.sql` já commitados — gerar nova migration para qualquer mudança futura.
- `apps/api/src/env.ts` — única porta de entrada das variáveis de ambiente da API; depende de `--env-file-if-exists` nos scripts `dev`/`start` (ver FIX-001).
- `pnpm-workspace.yaml` — contém `allowBuilds:`; não remover essa seção.
- `SETUP.md` — guia de criação da conta Supabase; será reescrito de novo quando a integração de código estiver pronta (próxima sessão).

## 💬 Última Sessão
**2026-06-26** — Pivô de arquitetura: o usuário esclareceu que o uso é single-user e não precisa de edição offline. Decidido (DEC-011/012/013): modelo online-first com Postgres no Supabase como única fonte de verdade (substitui Local-First + CRDT), Fastify mantido como camada de API sobre o Supabase (não substituído pela API automática dele), Supabase Auth para login, Supabase Storage para imagens, Vercel para o frontend (Cloudflare Pages avaliado e descartado — suporte a Next.js via Workers/OpenNext não é confiável no Windows). Código ajustado: `packages/crdt` removido, coluna `crdt_state` removida do schema (nova migration gerada e validada contra Postgres real). Todos os 4 workspaces revalidados (typecheck + lint limpos). Entregue SETUP.md com o passo a passo de criação da conta/projeto Supabase. Próximo passo: usuário cria o projeto Supabase; assistente implementa a integração de código (conexão SSL, Auth, Storage).
