# CONTEXT.md — Knowledge OS

> Arquivo **estável**. O assistente lê no início de cada sessão para se ambientar.
> Muda pouco: só em alteração estrutural (stack, arquitetura, escopo, nova armadilha descoberta).

---

## Visão Geral

Ferramenta própria de gestão do conhecimento e organização visual de ideias, construída do zero. Une quatro pilares que nenhuma ferramenta do mercado entrega simultaneamente: **notas ricas com grafo de relações** (estilo Obsidian/Logseq), **tabelas e bancos de dados relacionais** (estilo Notion), **busca global instantânea e semântica**, e **canvas infinito** para brainstorm e ligação visual de ideias. Web-First com capacidades Offline-First completas — o servidor sincroniza, não é a fonte de verdade.

**Usuário-alvo:** desenvolvedor/criador de conhecimento individual que precisa de uma ferramenta poderosa, rápida, sem limitações de plano e completamente própria.
**Problema resolvido:** todas as ferramentas existentes resolvem um ou dois pilares; nenhuma resolve os quatro juntos sem tier pago e sem perda de performance.

---

## Stack Tecnológica

**Frontend**
- **Framework:** Next.js 16 (App Router, Turbopack) — *atualizado de "15" nesta sessão de implementação, ver DEC-009*
- **Canvas:** tldraw v3 (motor de renderização, shapes customizados)
- **Editor de texto:** Tiptap v2 + ProseMirror
- **DB local (browser):** wa-sqlite (SQLite via WASM) + OPFS para persistência
- **CRDT:** @automerge/automerge (DEC-004 referenciava "2.0"; a versão atual resolvida é ^3.x — revisitar DEC-004 na F5)
- **Busca client-side:** Orama 3.x (índice invertido + vetor embutido)
- **Estado global:** Zustand + TanStack Query
- **UI base:** Radix UI + Tailwind CSS v4
- **Grafo visual:** D3.js v7 (Force Simulation)

**Backend**
- **Runtime:** Node.js 22 + Fastify
- **ORM:** Drizzle ORM
- **Banco primário:** PostgreSQL 16 + pgvector (busca semântica)
- **Sync CRDT:** Hocuspocus (WebSocket)
- **Storage de arquivos:** Cloudflare R2
- **Cache:** Redis 7 (Upstash)
- **Embeddings:** OpenAI text-embedding-3-small

**Infra**
- **Monorepo:** Turborepo + pnpm workspaces (ver DEC-007, DEC-008)
- **Deploy FE:** Vercel / Cloudflare Pages
- **Deploy BE:** Railway / Fly.io
- **CI/CD:** GitHub Actions

---

## Estrutura do Projeto

```
knowledge-os/                   ← raiz do monorepo Turborepo
├── apps/
│   ├── web/                    ← Next.js 15, frontend completo
│   │   ├── app/                ← App Router (layouts, páginas)
│   │   ├── components/
│   │   │   ├── canvas/         ← CanvasApp, CanvasShell, CanvasView e shapes
│   │   │   ├── editor/         ← TiptapEditor e extensões
│   │   │   ├── sidebar/        ← Sidebar, PageTree, DatabaseList
│   │   │   ├── inspector/      ← NodeInspector, BacklinksPanel
│   │   │   └── search/         ← SearchPalette (⌘K)
│   │   ├── hooks/              ← useBlock, useCanvas, useSearch, useSync…
│   │   ├── lib/
│   │   │   ├── sqlite/         ← wa-sqlite setup, queries, migrations
│   │   │   ├── crdt/           ← Automerge helpers e sync
│   │   │   └── search/         ← Orama index setup e helpers
│   │   └── store/              ← Zustand stores (canvas, layout, workspace)
│   └── api/                    ← Fastify backend
│       ├── routes/             ← REST endpoints por recurso
│       ├── sync/               ← Hocuspocus WebSocket server
│       ├── search/             ← Rotas de busca semântica (pgvector)
│       └── db/                 ← Drizzle schemas e migrations
├── packages/
│   ├── db/                     ← Schema Drizzle compartilhado (tipos TS)
│   ├── crdt/                   ← Automerge wrappers reutilizáveis
│   └── ui/                     ← Componentes Radix/Tailwind compartilhados
└── turbo.json
```

> Esta é a árvore **de visão completa** (todas as fases do ROADMAP). O que existe *de fato* no repositório agora está em STATUS.md — bem menor, porque só a F0 foi implementada.

---

## Como o modelo de dados funciona (CRÍTICO)

**Tudo é um `Block`.** É a entidade universal do sistema — existe uma única vez no banco e pode ser projetada como nota, linha de tabela ou nó de canvas.

```
Block(type='page')
  └─ Block(type='note')        → renderiza como nota de texto rica
  └─ Block(type='database')    → renderiza como tabela Notion
  └─ Block(type='canvas')      → renderiza como canvas infinito
       └─ canvas_node ──────→ Block(type='card')     ← mesmo block!
       └─ canvas_node ──────→ Block(type='note')     ← mesma nota!
```

A nota existe **uma vez** no SQLite. O canvas referencia sua posição via `canvas_nodes`. Ao editar a nota, todas as visões (tabela, grafo, canvas, sidebar) refletem imediatamente — sem sincronização, porque leem a mesma fonte.

Tabelas principais: `blocks`, `relations` (grafo de backlinks), `canvas_nodes`, `canvas_edges`, `database_schemas`, `search_vectors`.

---

## Como o Canvas funciona (CRÍTICO)

O **tldraw v3** é o motor. Shapes são classes `ShapeUtil` registradas em runtime — cada uma recebe um `blockId` e renderiza o Block correspondente dentro de um `HTMLContainer` (DOM nativo sobre SVG). Isso permite embeds ricos (Tiptap editor, tabelas) sem reimplementar renderização de texto.

Performance com 10k+ nós: **frustum culling via RBush**. A cada mudança de viewport, um spatial index retorna apenas os IDs visíveis; os demais nem existem no DOM. Level-of-detail (`full | thumb | dot`) decide o que renderizar por tamanho de nó na tela.

Conexões visuais são uma camada SVG absoluta sobre o canvas, calculando paths com A* para desviar de obstacles.

---

## Arquitetura — pontos-chave

- **Local-First:** app funciona 100% offline; servidor só sincroniza — ver DEC-003.
- **Uma entidade, múltiplas visões:** Block único, projeções diferentes — ver DEC-002.
- **CRDT para conflitos:** Automerge 2.0, cada Block tem seu próprio documento — ver DEC-004.
- **tldraw v3 como motor de canvas:** shapes customizados via ShapeUtil — ver DEC-001.
- **Orama no cliente:** busca < 5ms sem round-trip ao servidor — ver DEC-005.
- **Busca híbrida com RRF:** keyword (Orama + FTS5) + semântico (pgvector), fusão por Reciprocal Rank Fusion — ver DEC-006.
- **Monorepo Turborepo:** packages compartilhados entre web e api — ver DEC-007.

---

## Armadilhas Conhecidas

1. **Não usar localStorage para persistência no browser** — localStorage tem limite de 5MB e é síncrono. O correto é OPFS (Origin Private File System) via wa-sqlite, que é assíncrono e sem limite prático.

2. **Não renderizar todos os nós do canvas no DOM** — mesmo com tldraw, inserir 10k+ shapes sem frustum culling trava o browser. RBush é obrigatório antes de ultrapassar ~500 nós.

3. **Não editar o `crdt_state` diretamente no banco** — o campo é o estado serializado do Automerge. Toda mutação deve passar pela API do Automerge (`Automerge.change`); editar o BYTEA direto corrompe o documento de forma irreversível.

4. **Não duplicar conteúdo de Block em `canvas_nodes`** — `canvas_nodes` guarda apenas posição e estilo visual. Título, conteúdo e propriedades vivem exclusivamente no `Block`. Copiar campos para a tabela de nós cria drift de estado impossível de reconciliar.

5. **tldraw store ≠ Zustand store** — o tldraw mantém seu próprio store interno. O Zustand é para estado de UI (painel ativo, seleção, layout). Misturar os dois causa re-renders desnecessários e bugs de sincronização de seleção.

6. **Embeddings custam tokens** — não gerar embedding a cada keystroke. O pipeline correto é: salvar no SQLite local → debounce 2s → enviar ao backend → chunking → embedding → pgvector. Indexação deve ser assíncrona e silenciosa.

7. **pnpm 10+ bloqueia scripts de build de dependências nativas por padrão** — ao instalar pacotes como `esbuild`, `sharp` ou `unrs-resolver` (transitivos de drizzle-kit, Next.js e eslint-config-next), o pnpm ignora o `postinstall`/`install` deles por segurança e avisa `ERR_PNPM_IGNORED_BUILDS`. Isso pode até travar `turbo run <script>` com um erro confuso de "pnpm install exited 1". Resolver com `pnpm approve-builds --all` uma vez — a aprovação fica persistida em `pnpm-workspace.yaml` (`allowBuilds:`) e não precisa ser repetida (inclusive em CI).

8. **Não assumir que toda a stack usa a mesma versão do ESLint** — `apps/web` depende de `eslint-config-next`, cujos plugins transitivos (`eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`) hoje só suportam ESLint até `^9`. Forçar ESLint 10 ali quebra a instalação (`pnpm peers check` mostra o conflito). Ver DEC-010: `apps/web` fica em `^9`, os demais workspaces (sem essa dependência) usam `^10` livremente.

---

## Contexto de Produto

- **Usuário-alvo:** dev/criador que precisa de ferramenta poderosa, rápida e 100% própria.
- **Dor concreta:** ferramentas boas são pagas ou limitam features; as gratuitas não integram canvas + notas + banco de dados + busca num único produto.
- **O que é sucesso:** app que abre offline, sincroniza silenciosamente online, busca em < 5ms, canvas fluido com 5k+ nós, e notas que aparecem simultaneamente na tabela, no grafo e no canvas sem duplicação.
- **O que o projeto deliberadamente NÃO é:** ferramenta colaborativa em tempo real estilo Figma (collab é nice-to-have, não core), substituto de planilha (Excel/Sheets são melhores para dados numéricos pesados), CMS ou plataforma pública.
