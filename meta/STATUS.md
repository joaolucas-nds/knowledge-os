# STATUS.md — Estado Atual

> Arquivo **rolante**: descreve só o AGORA. O assistente lê no início para saber onde retomar.
> Item resolvido SAI daqui — vai para o CHANGELOG (se foi entrega) e/ou para o log da sessão.
> Médio e longo prazo NÃO ficam aqui — ficam no ROADMAP.

---

## Versão Atual
**[0.3.0]** — 2026-06-29 — integração de autenticação com Supabase implementada e validada de ponta a ponta (login, middleware/proxy, verificação de JWT no backend). Falta só conectar contra um projeto Supabase real (o usuário ainda precisa criar o projeto — ver SETUP.md).

## ✅ Funcionando (validado de fato)
- **`apps/web`** — login funcional via Supabase Auth: página `/login` (Server Component + Server Action `signIn`), `proxy.ts` (renovação de sessão + redirecionamento de rotas protegidas), `/auth/callback` (troca de code por sessão, para fluxos futuros de magic link/OAuth), botão de logout na home. Build de produção (`next build`) testado com env vars fake do Supabase — compila limpo, 4 rotas geradas (`/`, `/login`, `/auth/callback`, `/_not-found`) + Proxy ativo.
- **`apps/api`** — plugin de auth (`src/auth/plugin.ts`) verifica JWT HS256 do Supabase via `@fastify/jwt`. Rota de diagnóstico `/me` testada via **HTTP real** (não só simulação): sem token → 401; token assinado com secret errado/adulterado → 401; token válido → 200 com `userId`/`email` corretos extraídos do payload; `SUPABASE_JWT_SECRET` ausente → 503 `auth_not_configured` (distinto de erro de autenticação do usuário).
- **`packages/db`** — `client.ts` detecta automaticamente se precisa de SSL (qualquer host que não seja localhost) — testado contra Postgres local (sem SSL) e a lógica de detecção confirmada por leitura de código + typecheck (sem Supabase real ainda para validar SSL de fato, ver pendências).
- **`pnpm typecheck`** e **`pnpm lint`** — ✅ passam limpo nos 4 workspaces com todo o código novo.
- Tudo que já funcionava na sessão anterior (monorepo, schema sem `crdt_state`, health checks) continua validado.

## 🔧 Em Progresso
- **Conta/projeto Supabase real** — depende do usuário (SETUP.md tem o passo a passo). Sem isso, a integração está implementada e testada com valores fake/locais, mas não contra o serviço real.
- **Preencher os `.env` de produção** com as credenciais reais do Supabase (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET`) — pendente até o item acima.
- **Deploy em produção** (Vercel + host do `apps/api`) — ainda não iniciado, planejado para a F5 do ROADMAP.

## ❌ Quebrado / Com Problema
- Nenhum bug aberto. Um bug de tipos foi encontrado e corrigido durante esta sessão (conflito de module augmentation entre `@fastify/jwt` e tipagem própria) — ver FIX-002 em DECISIONS.md.

## 📋 Backlog (curto prazo — itens acionáveis)
- [ ] Você: criar o projeto no Supabase (SETUP.md), criar seu usuário único, pegar as 4 credenciais necessárias.
- [ ] Você: preencher os `.env`/`.env.local` reais com essas credenciais (SETUP.md tem o passo a passo de onde cada uma vai).
- [ ] Validar a conexão SSL de verdade contra o Postgres do Supabase (hoje só testado contra Postgres local sem SSL).
- [ ] Validar o fluxo de login completo no browser (hoje só testado via build + testes HTTP isolados do backend).
- [ ] Decidir host do `apps/api` para deploy (Render vs. Fly.io) — F5 do ROADMAP.

## 📁 Arquivos Críticos (não mexer sem contexto)
- `apps/web/proxy.ts` — substitui o antigo `middleware.ts` (Next.js 16 renomeou a convenção, ver DEC-015); roda em TODA rota (exceto estáticos) e decide redirecionamento de auth — bug aqui trava o app inteiro.
- `apps/api/src/auth/plugin.ts` — verificação de JWT; `request.user` é tipado via extensão de `@fastify/jwt` (não redeclarar `FastifyRequest` diretamente, ver FIX-002).
- `packages/db/src/client.ts` — `shouldUseSsl()` decide automaticamente se a conexão usa SSL; não passar `poolConfig.ssl` manualmente sem necessidade — o automático já cobre Supabase.
- `packages/db/src/schema.ts` — sem `crdt_state` desde a sessão anterior.
- Os 3 arquivos `.env.example` (`apps/web`, `apps/api`, `packages/db`) — `apps/api` e `packages/db` agora esperam a MESMA `DATABASE_URL` (Session mode, porta 5432 — ver DEC-014, não usar a porta 6543/Transaction mode).
- `SETUP.md` — guia de criação da conta Supabase; ainda não tem a seção final de "preencher os .env com os valores reais" (próxima versão, depois que o usuário tiver as credenciais).

## 💬 Última Sessão
**2026-06-29** — Implementação completa da integração com Supabase Auth, decidida na sessão anterior (DEC-012). Pesquisado e decidido: verificação de JWT via HS256/Legacy Secret (não JWKS), Session mode pooler porta 5432 em ambos os usos — não Transaction mode 6543 (DEC-014). `apps/web`: login via Server Action, `proxy.ts` (não `middleware.ts` — Next.js 16 renomeou a convenção, pego no primeiro build de validação, ver DEC-015) para renovar sessão e proteger rotas, callback route para fluxos futuros. `apps/api`: plugin de auth com `@fastify/jwt`, rota `/me` de diagnóstico. `packages/db`: SSL automático por host. Um bug de tipos encontrado e corrigido (FIX-002 — conflito de module augmentation). Tudo validado: typecheck/lint limpos nos 4 workspaces, build de produção do `apps/web` compilando, e — mais importante — os 4 cenários de auth testados via requisição HTTP real contra o `apps/api` rodando de verdade (não só leitura de código). Pendência: usuário ainda precisa criar o projeto Supabase real para a próxima validação (conexão SSL real, login real no browser).
