# CONTEXT.md — Knowledge OS

> Arquivo **estável**. O assistente lê no início de cada sessão para se ambientar.
> Muda pouco: só em alteração estrutural (stack, arquitetura, escopo, nova armadilha descoberta).

---

## Visão Geral

Ferramenta própria de gestão do conhecimento e organização visual de ideias, construída do zero, **para uso pessoal de um único usuário**. Une quatro pilares que nenhuma ferramenta do mercado entrega simultaneamente: **notas ricas com grafo de relações** (estilo Obsidian/Logseq), **tabelas e bancos de dados relacionais** (estilo Notion), **busca global instantânea e semântica**, e **canvas infinito** para brainstorm e ligação visual de ideias. Modelo **online-first, single-user**: o Postgres (hospedado no Supabase) é a única fonte de verdade, acessível de qualquer máquina com internet — sem requisito de edição offline (ver DEC-011, que supera o modelo Local-First original).

**Usuário-alvo:** uma única pessoa (o próprio criador do projeto) que precisa de uma ferramenta poderosa, rápida, sem limitações de plano e completamente própria, usável a partir de qualquer dispositivo seu.
**Problema resolvido:** todas as ferramentas existentes resolvem um ou dois pilares; nenhuma resolve os quatro juntos sem tier pago e sem perda de performance.

---

## Stack Tecnológica

**Frontend**
- **Framework:** Next.js 16 (App Router, Turbopack) — *atualizado de "15" nesta sessão de implementação, ver DEC-009*
- **Canvas:** tldraw v3 (motor de renderização, shapes customizados)
- **Editor de texto:** Tiptap v2 + ProseMirror
- **Auth:** Supabase Auth (`supabase-js`) — login single-user, sem tela pública de cadastro (DEC-012)
- **Busca client-side:** Orama 3.x (índice invertido + vetor embutido) — agora um *enhancement* de performance, não um requisito de funcionamento offline (ver DEC-011)
- **Estado global:** Zustand + TanStack Query
- **UI base:** Radix UI + Tailwind CSS v4
- **Grafo visual:** D3.js v7 (Force Simulation)

**Backend**
- **Runtime:** Node.js 22 + Fastify
- **ORM:** Drizzle ORM
- **Banco primário:** PostgreSQL hospedado no **Supabase** + pgvector (busca semântica) — ver DEC-012
- **Auth (verificação):** Fastify valida o JWT emitido pelo Supabase Auth em cada request
- **Storage de arquivos:** Supabase Storage (imagens) — Cloudflare R2 registrado como alternativa de troca direta se precisar de mais espaço gratuito (DEC-012)
- **Cache:** Redis 7 (Upstash) — ainda não implementado, avaliar necessidade real antes da F6
- **Embeddings:** OpenAI text-embedding-3-small

**Infra**
- **Monorepo:** Turborepo + pnpm workspaces (ver DEC-007, DEC-008)
- **Deploy FE:** Vercel (ver DEC-013 — Cloudflare Pages avaliado e descartado)
- **Deploy BE:** a definir entre hosts com tier grátis (Render/Fly.io) na F5 de deploy
- **CI/CD:** GitHub Actions

---

## Estrutura do Projeto

```
knowledge-os/                   ← raiz do monorepo Turborepo
├── apps/
│   ├── web/                    ← Next.js 16, frontend completo
│   │   ├── app/                ← App Router (layouts, páginas)
│   │   ├── components/
│   │   │   ├── canvas/         ← CanvasApp, CanvasShell, CanvasView e shapes
│   │   │   ├── editor/         ← TiptapEditor e extensões
│   │   │   ├── sidebar/        ← Sidebar, PageTree, DatabaseList
│   │   │   ├── inspector/      ← NodeInspector, BacklinksPanel
│   │   │   └── search/         ← SearchPalette (⌘K)
│   │   ├── hooks/              ← useBlock, useCanvas, useSearch…
│   │   ├── lib/
│   │   │   ├── auth/           ← supabase-js client, helpers de sessão
│   │   │   └── search/         ← Orama index setup e helpers
│   │   └── store/              ← Zustand stores (canvas, layout, workspace)
│   └── api/                    ← Fastify backend
│       ├── routes/             ← REST endpoints por recurso
│       ├── auth/                ← Middleware de verificação do JWT (Supabase Auth)
│       ├── search/             ← Rotas de busca semântica (pgvector)
│       └── db/                 ← Drizzle schemas e migrations
├── packages/
│   ├── db/                     ← Schema Drizzle compartilhado (tipos TS)
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

A nota existe **uma vez** no Postgres (hospedado no Supabase — única fonte de verdade, ver DEC-011/DEC-012). O canvas referencia sua posição via `canvas_nodes`. Ao editar a nota, todas as visões (tabela, grafo, canvas, sidebar) refletem imediatamente — sem sincronização entre cópias, porque toda visão lê do mesmo banco central.

Tabelas principais: `blocks`, `relations` (grafo de backlinks), `canvas_nodes`, `canvas_edges`, `database_schemas`, `search_vectors`.

---

## Como o Canvas funciona (CRÍTICO)

O **tldraw v3** é o motor. Shapes são classes `ShapeUtil` registradas em runtime — cada uma recebe um `blockId` e renderiza o Block correspondente dentro de um `HTMLContainer` (DOM nativo sobre SVG). Isso permite embeds ricos (Tiptap editor, tabelas) sem reimplementar renderização de texto.

Performance com 10k+ nós: **frustum culling via RBush**. A cada mudança de viewport, um spatial index retorna apenas os IDs visíveis; os demais nem existem no DOM. Level-of-detail (`full | thumb | dot`) decide o que renderizar por tamanho de nó na tela.

Conexões visuais são uma camada SVG absoluta sobre o canvas, calculando paths com A* para desviar de obstacles.

---

## Arquitetura — pontos-chave

- **Online-first, single-user:** Postgres (Supabase) é a única fonte de verdade; sem cópia local persistente, sem CRDT — ver DEC-011 (supera DEC-003 e DEC-004).
- **Uma entidade, múltiplas visões:** Block único, projeções diferentes — ver DEC-002.
- **tldraw v3 como motor de canvas:** shapes customizados via ShapeUtil — ver DEC-001.
- **Orama no cliente:** busca < 5ms sem round-trip ao servidor (enhancement de performance, não requisito de offline) — ver DEC-005.
- **Busca híbrida com RRF:** keyword (Orama + FTS5) + semântico (pgvector), fusão por Reciprocal Rank Fusion — ver DEC-006.
- **Monorepo Turborepo:** packages compartilhados entre web e api — ver DEC-007.
- **Supabase como provedor único de banco + auth + storage:** Fastify mantido como camada de API sobre ele — ver DEC-012.
- **Vercel para o frontend:** zero configuração para Next.js 16 — ver DEC-013.

---

## Armadilhas Conhecidas

1. **Postgres do Supabase exige conexão SSL** — o `Pool` do `pg` precisa de `ssl: true` (ou config equivalente) na connection string/poolConfig; sem isso a conexão falha. Validar ao implementar DEC-012.

2. **Não renderizar todos os nós do canvas no DOM** — mesmo com tldraw, inserir 10k+ shapes sem frustum culling trava o browser. RBush é obrigatório antes de ultrapassar ~500 nós.

3. **Não duplicar conteúdo de Block em `canvas_nodes`** — `canvas_nodes` guarda apenas posição e estilo visual. Título, conteúdo e propriedades vivem exclusivamente no `Block`. Copiar campos para a tabela de nós cria drift de estado impossível de reconciliar.

4. **tldraw store ≠ Zustand store** — o tldraw mantém seu próprio store interno. O Zustand é para estado de UI (painel ativo, seleção, layout). Misturar os dois causa re-renders desnecessários e bugs de sincronização de seleção.

5. **Embeddings custam tokens** — não gerar embedding a cada keystroke. O pipeline correto é: salvar no Postgres → debounce 2s → chunking → embedding → pgvector. Indexação deve ser assíncrona e silenciosa.

6. **pnpm 10+ bloqueia scripts de build de dependências nativas por padrão** — ao instalar pacotes como `esbuild`, `sharp` ou `unrs-resolver` (transitivos de drizzle-kit, Next.js e eslint-config-next), o pnpm ignora o `postinstall`/`install` deles por segurança e avisa `ERR_PNPM_IGNORED_BUILDS`. Isso pode até travar `turbo run <script>` com um erro confuso de "pnpm install exited 1". Resolver com `pnpm approve-builds --all` uma vez — a aprovação fica persistida em `pnpm-workspace.yaml` (`allowBuilds:`) e não precisa ser repetida (inclusive em CI).

7. **Não assumir que toda a stack usa a mesma versão do ESLint** — `apps/web` depende de `eslint-config-next`, cujos plugins transitivos (`eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`) hoje só suportam ESLint até `^9`. Forçar ESLint 10 ali quebra a instalação (`pnpm peers check` mostra o conflito). Ver DEC-010: `apps/web` fica em `^9`, os demais workspaces (sem essa dependência) usam `^10` livremente.

8. **Free tier do Supabase pausa o projeto após 7 dias de inatividade** — se você ficar uma semana sem abrir o app, a primeira requisição depois disso pode demorar (cold start) ou falhar até o projeto "despausar" no painel do Supabase. Não é bug do projeto — é característica do plano gratuito (ver DEC-012).

---

## Contexto de Produto

- **Usuário-alvo:** uma única pessoa (o próprio criador), que precisa de ferramenta poderosa, rápida e 100% própria, acessível de qualquer dispositivo seu.
- **Dor concreta:** ferramentas boas são pagas ou limitam features; as gratuitas não integram canvas + notas + banco de dados + busca num único produto.
- **O que é sucesso:** app acessível de qualquer máquina com internet, busca em < 5ms no cliente (com fallback no servidor), canvas fluido com 5k+ nós, e notas que aparecem simultaneamente na tabela, no grafo e no canvas sem duplicação.
- **O que o projeto deliberadamente NÃO é:** ferramenta multi-usuário ou colaborativa em tempo real estilo Figma (é single-user, por escolha — ver DEC-011), capaz de funcionar sem internet (sem requisito de offline — ver DEC-011), substituto de planilha (Excel/Sheets são melhores para dados numéricos pesados), CMS ou plataforma pública.
