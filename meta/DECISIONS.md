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
**Data:** 2026-06-05 · **Status:** aceita

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
**Data:** 2026-06-05 · **Status:** aceita

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
