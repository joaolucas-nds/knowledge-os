# DECISIONS.md — Registro de Decisões

> Arquivo que **cresce devagar**. Guarda o PORQUÊ — o que o código sozinho não conta.
> Não reescreva entradas antigas; se uma decisão for substituída, marque «SUPERADA por DEC-N» e adicione a nova.

---

## DEC-001 — tldraw v3 como motor de canvas infinito
**Data:** 2026-06-05 · **Status:** aceita

### Contexto
Precisamos de um canvas infinito com zoom/pan fluido, suporte a shapes customizados (notas ricas, tabelas embebidas), seleção múltipla, resize e histórico de undo/redo. Construir do zero seria meses de trabalho apenas na camada de renderização.

### Decisão
Adotar o tldraw v3 como motor de canvas. Estender via sistema de `ShapeUtil` para registrar shapes customizados (`NoteShapeUtil`, `DatabaseShapeUtil`). Usar `HTMLContainer` para renderizar DOM nativo (Tiptap, tabelas) dentro do canvas SVG.

### Alternativas consideradas
- **Konva.js / Fabric.js** — Canvas 2D puro; não suporta DOM dentro dos shapes, impossibilitando o editor de texto rico embutido.
- **React Flow** — Ótimo para grafos de nós fixos, mas não é um canvas livre de brainstorming; sem suporte a freehand draw.
- **Excalidraw (como lib)** — Focado em desenho à mão; API de extensão limitada para shapes complexos com estado.
- **Construção própria (WebGL/HTML5 Canvas)** — Estimativa de 4-6 meses só para paridade com o que o tldraw já entrega.

### Consequências
tldraw v3 entrega: zoom/pan com CSS transform (GPU), undo/redo via patches, seleção/resize nativos, export SVG/PNG. Custo: dependência de lib com API que pode mudar entre versões; ShapeUtil requer seguir contrato específico da versão 3.

---

## DEC-002 — "Tudo é um Block" como entidade universal de dados
**Data:** 2026-06-05 · **Status:** aceita

### Contexto
O projeto precisa que a mesma nota apareça simultaneamente como item da sidebar, linha de tabela, nó de canvas e ponto do grafo — sem duplicação. Precisamos de uma entidade que possa ser projetada em múltiplas visões sem perder consistência.

### Decisão
Criar a entidade `Block` como única fonte de verdade. `type` define o comportamento (`note | page | database | canvas | card`). Canvas, tabela e grafo são *projeções* do mesmo Block — nunca cópias. `canvas_nodes` guarda apenas posição e estilo visual, com `block_id` como foreign key.

### Alternativas consideradas
- **Tabelas separadas por tipo (NoteTable, CardTable, DatabaseRowTable)** — Mais familiar, mas impossibilita "a mesma nota em múltiplas visões" sem sincronização complexa entre tabelas.
- **Documentos JSON em um store chave-valor** — Flexível, mas perde queries relacionais e FTS5 nativo do SQLite.

### Consequências
Qualquer edição em qualquer visão reflete imediatamente em todas as outras (mesma linha no banco). Adicionar novo tipo de Block não exige novo schema — só um novo `type` e um novo componente React. Custo: queries precisam filtrar por `type` corretamente; queries sem filtro retornam entidades heterogêneas.

---

## DEC-003 — Local-First com wa-sqlite + OPFS
**Data:** 2026-06-05 · **Status:** SUPERADA por DEC-011 (2026-06-26)

> Esta decisão valia para um modelo multi-dispositivo *offline-capable*. O projeto pivotou para online-first single-user (ver DEC-011) — wa-sqlite/OPFS não chegou a ser implementado (ficou pendente em duas sessões seguidas) e deixou de ser necessário. Entrada mantida íntegra abaixo por registro histórico do raciocínio original.

### Contexto
O produto precisa funcionar 100% offline (avião, internet instável, preferência do usuário). A persistência deve ser robusta, sem limite de 5MB do localStorage e com suporte a SQL completo para queries relacionais e FTS5.

### Decisão
Usar `wa-sqlite` (SQLite compilado para WASM) com backend OPFS (Origin Private File System) para persistência durável no browser. WAL mode ativado para escritas concorrentes. O servidor backend é tratado como canal de sincronização, não como fonte de verdade primária.

### Alternativas consideradas
- **IndexedDB puro** — Sem SQL, sem FTS5; queries complexas em JS são lentas e verbosas.
- **localStorage** — Limite de 5MB, síncrono, bloqueante. Inviável para um PKM.
- **PouchDB** — Abstração sobre IndexedDB; perde SQL nativo e FTS5.
- **SQLite via sql.js** — Não persiste no disco (in-memory apenas); dados perdidos ao fechar aba.

### Consequências
Queries SQL completas no browser, incluindo FTS5 para busca offline. OPFS garante persistência entre sessões sem limite prático de tamanho. Custo: wa-sqlite roda em Worker (API assíncrona); inicialização requer sequência cuidadosa (Worker → OPFS → WAL → migrations). Não funciona em Safari < 15.2.

---

## DEC-004 — Automerge 2.0 para sincronização CRDT
**Data:** 2026-06-05 · **Status:** SUPERADA por DEC-011 (2026-06-26)

> Esta decisão resolvia conflito de edição concorrente offline — cenário que não existe num projeto single-user online-first (ver DEC-011). `packages/crdt` (esqueleto criado na sessão de F0) foi removido do monorepo. Entrada mantida íntegra abaixo por registro histórico.

### Contexto
Com múltiplos dispositivos e possibilidade de edição offline, precisamos de uma estratégia de merge que resolva conflitos deterministicamente sem exigir lock ou "último a salvar vence".

### Decisão
Cada `Block` tem seu próprio documento Automerge serializado em `crdt_state` (BYTEA). Edições offline geram deltas locais. Ao reconectar, o Hocuspocus server faz merge via `Automerge.merge()` — determinístico, sem perda de dados.

### Alternativas consideradas
- **Yjs** — CRDT maduro e performático; escolhemos Automerge pela API mais ergonômica para documentos estruturados com campos tipados, não apenas texto.
- **Last-write-wins (timestamp)** — Simples, mas perde edições concorrentes legítimas. Inaceitável para um PKM onde o usuário edita no celular e no desktop simultaneamente.
- **OT (Operational Transformation)** — Requer servidor centralizado para transformar operações; quebra o princípio Local-First.

### Consequências
Histórico de versões gratuito (log de patches do Automerge = time-travel). Merge offline→online é transparente. Custo: `crdt_state` cresce com o histórico; precisará de compactação periódica (`Automerge.save()` + garbage collection de patches antigos).

---

## DEC-005 — Orama 3.x para busca client-side
**Data:** 2026-06-05 · **Status:** aceita

### Contexto
A busca precisa ser instantânea (< 5ms) e funcionar offline. Round-trips ao servidor para cada keystroke são inaceitáveis. Precisamos de um motor de busca que rode inteiramente no browser.

### Decisão
Usar Orama 3.x como índice de busca client-side. Indexa títulos, conteúdo textual e tags de todos os Blocks ao carregar o workspace. Suporta stemming PT/EN, boost por campo, tolerância a typos e highlight de snippet. FTS5 do SQLite local serve como fallback para conteúdo não indexado ainda.

### Alternativas consideradas
- **Minisearch** — Mais leve, mas sem suporte nativo a embeddings vetoriais para futura busca semântica local.
- **Fuse.js** — Fuzzy search simples; sem ranking BM25, sem boost, sem highlight. Adequado para listas pequenas, não para PKM com milhares de notas.
- **Lunr.js** — Descontinuado na prática; sem manutenção ativa.

### Consequências
Busca offline completa sem servidor. Orama suporta inserção incremental (novo Block → `insert` no índice em runtime). Custo: índice ocupa memória RAM (estimativa: ~50KB por 1.000 Blocks); para workspaces muito grandes (>50k Blocks), avaliar estratégia de índice particionado.

---

## DEC-006 — Busca híbrida com Reciprocal Rank Fusion (RRF)
**Data:** 2026-06-05 · **Status:** aceita

### Contexto
Busca por keyword perde resultados semanticamente relacionados ("aprendizado de máquina" não encontra nota sobre "machine learning"). Busca semântica pura perde resultados exatos por título. Precisamos do melhor dos dois mundos.

### Decisão
No backend, executar keyword search (PostgreSQL FTS) e semantic search (pgvector cosine similarity) em paralelo, fundir os rankings via RRF (`score = 1/(60+rank_keyword) + 1/(60+rank_semantic)`). No cliente, Orama + FTS5 funcionam offline; pgvector é enhancement online.

### Alternativas consideradas
- **Só keyword (FTS5/FTS)** — Rápido, mas sem semântica; não encontra sinônimos ou conceitos relacionados.
- **Só semântico (pgvector)** — Semântica boa, mas lento para queries exatas por título; requer servidor sempre.
- **Elasticsearch** — Híbrido nativo, mas adiciona infra pesada e custo operacional alto para projeto individual.

### Consequências
Qualidade de busca significativamente superior à maioria das ferramentas do mercado. Custo: pipeline de embeddings (chunking → API OpenAI → pgvector) adiciona latência e custo por token. Mitigação: indexar assincronamente com debounce; usar `text-embedding-3-small` (mais barato).

---

## DEC-007 — Monorepo com Turborepo
**Data:** 2026-06-05 · **Status:** aceita

### Contexto
O projeto tem frontend (Next.js), backend (Fastify) e packages compartilhados (schema DB, tipos CRDT, componentes UI). Sem monorepo, manter tipos sincronizados entre apps exige publicação de packages ou cópia manual — ambos frágeis.

### Decisão
Monorepo com Turborepo. Estrutura: `apps/web`, `apps/api`, `packages/db` (schema compartilhado), `packages/crdt` (wrappers Automerge), `packages/ui` (componentes Radix/Tailwind).

### Alternativas consideradas
- **Repos separados** — Independência total, mas tipagem compartilhada vira dívida; breaking changes no schema quebram o frontend silenciosamente.
- **Nx** — Mais poderoso para grandes organizações; overkill para projeto individual/pequeno time.

### Consequências
`packages/db` é a única fonte de verdade para tipos TypeScript do schema. Mudança no schema atualiza frontend e backend simultaneamente. Turborepo cacheia builds — segundo build é instantâneo. Custo: curva de aprendizado inicial no setup de paths e referencias entre packages.

---

## DEC-008 — pnpm como gerenciador de pacotes do monorepo
**Data:** 2026-06-24 · **Status:** aceita

### Contexto
DEC-007 escolheu Turborepo mas não fixou o gerenciador de pacotes. Ao iniciar a implementação da F0, essa decisão não podia mais ficar implícita: workspaces, lockfile e CI dependem dela.

### Decisão
Usar pnpm (`pnpm-workspace.yaml` com `apps/*` e `packages/*`) como gerenciador de pacotes e executor de workspaces do monorepo. Versão fixada via campo `packageManager` no `package.json` raiz (Corepack-compatível).

### Alternativas consideradas
- **npm workspaces** — funcional, mas sem content-addressable store; instala mais lento e duplica disco em monorepos grandes.
- **Yarn (Berry/PnP)** — bom suporte a workspaces, mas PnP costuma exigir ajustes extras em ferramentas que esperam `node_modules` real (Next.js, alguns plugins de bundler).
- **Bun** — instalação muito rápida, mas ecossistema de compatibilidade com Drizzle-kit/tldraw/Automerge ainda menos testado em produção; risco maior para um projeto que já empilha bastante tecnologia nova.

### Consequências
pnpm cria `node_modules` real (compatível com qualquer ferramenta) só com links para um store global — instala rápido e sem duplicar disco entre os 5 workspaces. Custo: a partir do pnpm 10/11, scripts de build de dependências nativas (esbuild, sharp, etc.) ficam bloqueados por padrão até aprovação explícita (`pnpm approve-builds`); a aprovação foi feita e persistida em `pnpm-workspace.yaml` (`allowBuilds`), então não bloqueia instalações futuras nem CI.

---

## DEC-009 — Next.js 16 substitui a escolha original de Next.js 15
**Data:** 2026-06-24 · **Status:** aceita · **SUPERA parcialmente a stack descrita na sessão de 2026-06-05 (CONTEXT.md)**

### Contexto
O CONTEXT.md original (sessão de planejamento, 2026-06-05) registrou "Next.js 15 (App Router)" como stack. Ao resolver as dependências reais do `apps/web` contra o npm registry para iniciar a F0 (2026-06-24), a versão "latest" resolvida foi `^16.2.9` — o Next.js 16 já é a major estável corrente (lançado em out/2025, com a 16.2.6 publicada em mai/2026 corrigindo 13 advisories de segurança). Começar um projeto novo deliberadamente numa major já substituída não fazia sentido.

### Decisão
Adotar Next.js 16 como a versão real da stack, substituindo a referência a "15" no CONTEXT.md. Principais implicações técnicas já refletidas no código desta F0:
- Turbopack é o bundler padrão (dev e build) — nenhuma flag extra necessária.
- Async Request APIs (`params`/`searchParams`) são 100% assíncronas — não há mais fallback síncrono. A home page desta F0 não usa params, mas qualquer rota dinâmica futura (F1+) precisa `await params`.
- Cache Components (`"use cache"`) são opt-in — por padrão, todo código dinâmico roda a cada request. Isso é favorável ao projeto: não queremos cache implícito escondendo dados locais/dinâmicos.
- Mínimos exigidos: Node ≥ 20.9 (usamos 22, ok) e TypeScript ≥ 5.1 (usamos 6.0, ok).

### Alternativas consideradas
- **Manter Next.js 15 "porque foi o que decidimos antes"** — rejeitada: regredir deliberadamente para uma major já substituída, no primeiro dia de código, criaria dívida técnica imediata sem nenhum ganho (a migração 15→16 é majoritariamente mecânica via codemod, mas ainda é trabalho — melhor pagar esse custo nunca do que pagar mais tarde com mais código em cima).

### Consequências
CONTEXT.md precisa de uma atualização pontual na tabela de stack (Next.js 15 → 16). Nenhuma outra peça da arquitetura documentada depende da diferença entre 15 e 16 o suficiente para exigir mudança (App Router, Server Components e a estratégia de fetch sem cache na home page continuam válidos). Ponto de atenção para a F1+: revisar a documentação do tldraw/Tiptap quanto a `transpilePackages`/Turbopack antes de integrá-los (comentário já deixado em `next.config.ts`).

---

## DEC-010 — ESLint fixado em ^9 no apps/web; ^10 nos demais workspaces
**Data:** 2026-06-24 · **Status:** aceita

### Contexto
Ao instalar ESLint "latest" (^10.5.0) em todo o monorepo, `pnpm peers check` revelou que os plugins transitivos do `eslint-config-next` (eslint-plugin-react, eslint-plugin-jsx-a11y, eslint-plugin-import) ainda travam o peer range em `^9` — o ecossistema do Next.js não acompanhou o lançamento do ESLint 10 ainda.

### Decisão
`apps/web` usa `eslint@^9` (única versão compatível com `eslint-config-next` hoje). Os demais workspaces (`packages/db`, `packages/crdt`, `packages/ui`, `apps/api`) usam `eslint@^10`, sem essa restrição, com uma base de regras compartilhada em `eslint.config.shared.mjs` (typescript-eslint + regras Node).

### Alternativas consideradas
- **Forçar ESLint 9 em todo o monorepo "por uniformidade"** — rejeitada: não há motivo técnico para isso, e usar a versão mais nova onde é seguro (4 dos 5 workspaces) é estritamente melhor.
- **Usar FlatCompat para tentar emular eslint-config-next manualmente sob ESLint 10** — rejeitada por ora: issues abertas no próprio repositório do Next.js (#84596, #64114) mostram que isso já causou erros de estrutura circular; a config flat nativa do `eslint-config-next` (`eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`, sem FlatCompat) é o caminho oficial atual e foi o que usamos.

### Consequências
Cada workspace tem seu próprio `eslint.config.mjs` (não um único arquivo na raiz) — necessário porque os conjuntos de plugins/peer ranges são incompatíveis entre apps/web e o resto. `pnpm peers check` ficou limpo (zero conflitos) depois do ajuste. Revisitar esta decisão quando `eslint-config-next` atualizar seus peers para `^10`.

---

## FIX-001 — apps/api não carregava o .env (DATABASE_URL nunca chegava ao processo)
**Data:** 2026-06-24

- **Sintoma:** `apps/api` subia normalmente e `/health` respondia `ok`, mas `/health/db` sempre retornava `"not_configured"` — mesmo depois de copiar `.env.example` para `.env` e preencher `DATABASE_URL` com um Postgres real rodando.
- **Causa raiz:** `loadEnv()` (em `src/env.ts`) lê direto de `process.env`. Nada no boot da aplicação carregava o arquivo `.env` para dentro de `process.env` antes disso — nem o pacote `dotenv`, nem uma flag do Node. O `.env.example` dava a falsa sensação de que "copiar e preencher" bastava.
- **Solução:** os scripts `dev` e `start` do `apps/api` passaram a usar a flag nativa do Node 22 `--env-file-if-exists=<arquivo>` (`tsx watch --env-file-if-exists=.env src/index.ts` / `node --env-file-if-exists=.env dist/index.js`). Escolhida em vez do pacote `dotenv` por dois motivos: (1) zero dependência nova; (2) a variante `-if-exists` não falha quando o arquivo não existe — essencial em produção (Railway/Fly.io), onde as variáveis chegam injetadas pela plataforma, sem arquivo `.env` físico. `packages/db/drizzle.config.ts` continua usando `import "dotenv/config"` porque é executado pela CLI do drizzle-kit, não pelos nossos scripts — ali o pacote `dotenv` é o jeito certo mesmo.
- **Lição:** existir um `.env.example` não garante que o `.env` seja de fato carregado — sempre validar o caminho completo (variável realmente chegando em `process.env` dentro do processo) antes de assumir que está pronto. Encontrado batendo em `/health/db` de verdade contra um Postgres local: respondeu `"not_configured"` antes da correção e `"ok"` depois — só a chamada real revelou o problema, a leitura do código não seria suficiente.

---

## DEC-011 — Modelo "online-first, single-user" substitui Local-First + CRDT
**Data:** 2026-06-26 · **Status:** aceita · **SUPERA DEC-003 e DEC-004**

### Contexto
O projeto foi desenhado originalmente (sessão de 2026-06-05) para um cenário multi-dispositivo *offline-capable*: editar sem internet em qualquer aparelho e sincronizar depois, com merge automático de conflitos. Esse cenário exige uma pilha cara — wa-sqlite+OPFS no browser (DEC-003) e CRDT via Automerge (DEC-004) — porque resolver "duas edições concorrentes da mesma nota, feitas offline, em dispositivos diferentes" sem perder dados é um problema genuinamente difícil.

Ao retomar o projeto para uso real (sessão de 2026-06-26), o usuário esclareceu dois pontos que mudam o problema: (1) o uso é **single-user** — só uma pessoa, nunca uma equipe; (2) **não há requisito de edição offline** — o uso é sempre com internet, só precisa funcionar a partir de máquinas diferentes. Sob essas duas condições, o cenário que o CRDT resolve (conflito concorrente offline) deixa de existir: com uma fonte única de verdade sempre acessível (Postgres na nuvem) e um usuário só, duas escritas na mesma nota ao mesmo tempo são uma exceção rara (ex.: duas abas abertas), não a norma — e nem precisam de merge automático, só de o usuário não fazer isso (ou, na pior das hipóteses, "o que salvar por último vence" é uma perda aceitável, não um problema sistêmico).

Sinal adicional, não só teórico: `wa-sqlite+OPFS` e a integração real do `packages/crdt` ficaram como pendência em **duas sessões seguidas** de implementação (ver STATUS.md de 2026-06-24) — nenhuma das duas chegou a ser sequer iniciada, enquanto o resto da F0 avançou e foi validado de ponta a ponta. Isso é evidência prática de que a complexidade não estava compensando para este projeto específico.

### Decisão
Adotar um modelo online-first: o Postgres (agora hospedado, ver DEC-012) é a **única** fonte de verdade. Não há cópia local persistente do banco no browser, não há documento CRDT por Block, não há servidor de sincronização dedicado (Hocuspocus). Cada dispositivo lê e escreve direto no mesmo banco central via a API (`apps/api`). "Multi-dispositivo" passa a ser um efeito colateral natural de ter uma única fonte de dados acessível pela internet — não uma feature que precisa de arquitetura própria.

Removido do monorepo: `packages/crdt` (esqueleto criado na F0, nunca usado em produção). Removida do plano: a integração wa-sqlite/OPFS no `apps/web`. Schema Drizzle (`blocks`, `relations`) **não muda** — o modelo "tudo é um Block" é ortogonal a onde o Postgres mora.

### Alternativas consideradas
- **Manter o plano CRDT "para o futuro, caso um dia precise"** — rejeitada: arquitetura especulativa para um requisito que o próprio usuário confirmou não ter. Carregar essa complexidade agora, sem uso real dela, é exatamente o tipo de dívida que esta mesma sessão está cortando.
- **Versão simplificada de CRDT só para "duas abas abertas"** — considerada e descartada por ora: Supabase Realtime (ver DEC-012) cobre o caso prático ("avisar a aba aberta que algo mudou") a um custo muito menor que adaptar Automerge para esse cenário restrito. Revisitar se algum dia o uso real mostrar que isso não basta.
- **Suporte offline básico via Service Worker + fila de escrita** (sem CRDT completo) — não descartada, só **adiada**: é a forma natural de adicionar "editar no avião" no futuro, se vier a ser necessário, sem reviver todo o aparato de CRDT. Registrada em IDEAS.md para não perder a ideia.

### Consequências
Simplificação grande: cai uma dependência inteira (`@automerge/automerge`), um conceito de servidor inteiro (Hocuspocus/WebSocket de sync), e toda a complexidade de inicialização do wa-sqlite (Worker, VFS, WAL) no browser. O ROADMAP perde a F5 original ("Sincronização e Colaboração via CRDT") — substituída por uma F5 sobre deploy real em produção (ver ROADMAP.md). Custo: se o projeto algum dia precisar mesmo de offline ou de múltiplos usuários reais, essa arquitetura terá que ser revisitada do zero — decisão consciente de não pagar esse custo agora por um requisito que não existe hoje.

---

## DEC-012 — Supabase como provedor de Postgres + Auth + Storage; Fastify mantido como camada de API
**Data:** 2026-06-26 · **Status:** aceita

### Contexto
Decidido o modelo online-first (DEC-011), falta escolher onde o Postgres mora, como resolver login (single-user) e onde guardar imagens — e decidir se o `apps/api` (Fastify, validado na F0) continua existindo ou é substituído pela API automática que serviços como o Supabase geram sobre o próprio Postgres.

### Decisão
- **Banco:** Postgres hospedado no **Supabase** (free tier para começar — 500 MB de banco, suficiente para muito tempo de uso pessoal só com texto). `packages/db` não muda de schema; só troca a `DATABASE_URL` (do Postgres local para a connection string do Supabase) e passa a exigir SSL na conexão.
- **Login:** **Supabase Auth**, configurado para um único usuário (você) — sem tela pública de cadastro. O `apps/web` (Next.js) cuida da UI de login via `supabase-js`; o `apps/api` (Fastify) verifica o token (JWT) que o Supabase emite em cada request, num middleware pequeno — sem reinventar hash de senha, sessão, etc.
- **Imagens:** **Supabase Storage** para começar (1 GB grátis), guardando no Postgres só a URL do arquivo, nunca o binário. Cloudflare R2 (10 GB grátis, sem cobrança de egress) fica registrado como alternativa de troca direta se o 1 GB for insuficiente — não é decisão definitiva, é a porta de entrada mais simples (uma conta a menos para gerenciar agora).
- **`apps/api` (Fastify) é mantido**, não substituído pela API automática do Supabase (PostgREST). Continua sendo o único lugar que fala com o Postgres via Drizzle.

### Alternativas consideradas
- **Eliminar o Fastify, `apps/web` fala direto com o Supabase via `supabase-js`** — considerada seriamente (menos uma peça para hospedar). Rejeitada por ora: jogaria fora o `apps/api` inteiro, já validado de ponta a ponta na sessão de F0 (schema, migration, smoke test, health checks reais), por uma reescrita não estritamente necessária agora. Mudança grande demais para o ganho atual — fica registrada como opção real para o futuro, se a manutenção de duas pontas (Fastify + Supabase) se mostrar mais trabalho do que vale.
- **Auth próprio (senha única em variável de ambiente, sem Supabase Auth)** — rejeitada: é menos código só na aparência. Supabase Auth já resolve hash de senha, sessão, expiração de token, tudo de forma testada em produção, de graça — reinventar isso mal é o tipo de "simplicidade" que custa mais caro depois (vulnerabilidade, bug de sessão).
- **Render/Railway/Neon (Postgres) sem o resto do pacote Supabase** — rejeitada: exigiria juntar 3 serviços separados (banco + auth + storage) em vez de 1, sem ganho real para um projeto pessoal pequeno. Supabase entrega os três com uma única conta e um único free tier.

### Consequências
`apps/api` continua precisando de um host sempre ligado (não é mais "só roda no seu PC") para que outros dispositivos o alcancem — escolha do host (Render/Fly.io, ambos com tier grátis) fica para a sessão de implementação. `client.ts` do `packages/db` precisa de ajuste de SSL na config do `Pool` (Supabase exige conexão criptografada) — pendente de validar com uma connection string real. Free tier do Supabase pausa o projeto após 7 dias sem uso — irrelevante para uso pessoal frequente, mas vale lembrar se for ficar muito tempo sem abrir o app.

---

## DEC-013 — Vercel para o frontend (não Cloudflare Pages)
**Data:** 2026-06-26 · **Status:** aceita

### Contexto
O usuário considerou Cloudflare Pages como alternativa à Vercel para hospedar o `apps/web` (Next.js 16).

### Decisão
Usar **Vercel** para o deploy do `apps/web`.

### Alternativas consideradas
- **Cloudflare Pages** — rejeitada: a própria Cloudflare descontinuou a recomendação de "Pages" puro para Next.js (suporte só ao Edge Runtime, sem `next/image` completo). O caminho atual deles é Cloudflare *Workers* via adaptador OpenNext — que funciona, mas (a) exige uma camada de build extra (transformar a saída do Next para rodar no Workers), e (b) a própria documentação do OpenNext avisa que **suporte completo no Windows não é garantido** — relevante porque o ambiente de desenvolvimento é Windows. Para um projeto pessoal de um usuário só, sem necessidade de escala global nem economia de custo em volume, essa fricção extra não compensa.
- **Vercel** — aceita: é a mantenedora do próprio Next.js, zero configuração adicional para Server Components, Cache Components e o modelo de fetch sem cache já usado na home page. Tier gratuito ("Hobby") cobre uso de um usuário só sem custo.

### Consequências
Nenhuma mudança de código necessária — o `apps/web` já está estruturado de forma compatível com deploy direto na Vercel (basta conectar o repositório). Cloudflare ainda entra no projeto, mas só como Storage (R2), se vier a substituir o Supabase Storage — papel bem mais simples que hospedar o app inteiro.
