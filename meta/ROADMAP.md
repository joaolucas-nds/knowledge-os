# ROADMAP.md — Plano de Evolução do Knowledge OS

> Plano deliberado em fases. Cada fase tem objetivo e critério de conclusão claro.
> Estado: 🟢 concluída · 🟡 em curso/próxima · 🔵 futura · 🚫 descartada.
> Médio e longo prazo vivem AQUI, não no STATUS.

---

## 🟡 F0 — Fundação Técnica *(em curso)*
**Objetivo:** Repositório existindo, stack rodando, autenticação funcional. "Hello World" que persiste no SQLite local.
**Critério de conclusão:** `apps/web` e `apps/api` rodando em dev; wa-sqlite inicializando com OPFS; primeiro Block criado e persistido localmente; login/logout funcionando.
**Estimativa:** Semanas 1–2

- [x] Criar repositório com estrutura Turborepo (`apps/web`, `apps/api`, `packages/db`, `packages/crdt`, `packages/ui`) — pnpm workspaces (ver DEC-008).
- [x] Configurar TypeScript strict em todos os packages.
- [ ] Setup wa-sqlite + OPFS no browser (Worker, WAL mode, migrations automáticas) — próximo passo.
- [x] Schema Drizzle inicial: tabelas `blocks` e `relations` — migration gerada e aplicada contra Postgres real.
- [x] API REST base com Fastify (health check, CORS, rate limit).
- [ ] Autenticação com Better Auth ou Clerk — ainda não decidido qual dos dois.
- [x] CI básico no GitHub Actions (typecheck + lint) — criado, ainda não exercitado por um push real.

---

## 🔵 F1 — Core de Notas *(futura)*
**Objetivo:** O produto precisa existir como editor de notas antes de qualquer canvas. Editor rico, hierarquia, wikilinks e sincronização básica.
**Critério de conclusão:** Criar nota com Tiptap, navegar pela hierarquia na sidebar, escrever `[[wikilink]]` e ver backlinks aparecerem — tudo funcionando offline.
**Estimativa:** Semanas 3–5

- [ ] Integrar Tiptap v2 com extensões base.
- [ ] Slash commands (`/note`, `/database`, `/canvas`, `/heading`).
- [ ] `[[wikilinks]]` com autocomplete e criação automática de `relation` no SQLite.
- [ ] Hierarquia de páginas via `parent_id` (sidebar tree com drag-and-drop).
- [ ] CRUD completo de Blocks (create, read, update, soft delete).
- [ ] Sincronização simples com backend (save on change + debounce 500ms).
- [ ] Export de nota como Markdown.

---

## 🔵 F2 — Canvas Infinito *(futura)*
**Objetivo:** Canvas tldraw v3 funcionando com NoteShape e DatabaseShape embebidos, edges e frustum culling.
**Critério de conclusão:** Criar canvas, arrastar nota existente para ele, conectar dois nós com edge, fechar e reabrir — tudo persistido e fluido com 500+ nós.
**Estimativa:** Semanas 6–9

- [ ] Integrar tldraw v3 (`CanvasView`).
- [ ] Registrar `NoteShapeUtil` com Tiptap embutido via `HTMLContainer`.
- [ ] Registrar `DatabaseShapeUtil` com DatabaseView embutido.
- [ ] `CanvasEdges`: SVG overlay com A* pathfinding e labels editáveis.
- [ ] `CanvasToolbar`: ferramentas com hotkeys (V/H/N/T/P/C).
- [ ] Spatial index RBush: frustum culling + LOD (`full | thumb | dot`).
- [ ] Persistência de `canvas_nodes` e `canvas_edges` no SQLite.
- [ ] `NodeInspector`: props, backlinks e style panel ao selecionar shape.

---

## 🔵 F3 — Banco de Dados Relacional *(futura)*
**Objetivo:** Database Notion-like funcional como Block independente e como shape no canvas.
**Critério de conclusão:** Criar Database, adicionar colunas de tipos diferentes, filtrar e ordenar, criar relação entre duas Databases — tudo funcionando.
**Estimativa:** Semanas 10–13

- [ ] `database_schemas`: colunas dinâmicas com tipos (Text, Number, Select, Date, Relation, Formula).
- [ ] Views: Table, Board (Kanban), Gallery, Calendar.
- [ ] Edição inline de células com teclado completo.
- [ ] Filtros e ordenação por coluna.
- [ ] Relation columns: ligação entre Databases via tabela `relations`.
- [ ] Formula columns: expressões simples (soma, contagem, rollup).

---

## 🔵 F4 — Busca Global *(futura)*
**Objetivo:** Paleta ⌘K com busca instantânea offline cobrindo notas, canvas e tabelas.
**Critério de conclusão:** Abrir ⌘K, digitar 3 letras, ver resultados com snippet highlight em < 100ms, clicar e o canvas ir direto ao nó.
**Estimativa:** Semanas 14–16

- [ ] Orama index local: indexar todos os Blocks ao carregar workspace.
- [ ] Atualização incremental do índice a cada mutação de Block.
- [ ] `SearchPalette` (⌘K): UI com navegação por teclado, highlight e preview.
- [ ] `useJumpToNode`: mover viewport do tldraw para o nó encontrado via camera API.
- [ ] FTS5 fallback para conteúdo não-indexado pelo Orama.
- [ ] Filtros por tipo (notas, canvas, tabelas, pages).
- [ ] Histórico de buscas recentes (IndexedDB).

---

## 🔵 F5 — Sincronização e Colaboração *(futura)*
**Objetivo:** Múltiplos dispositivos com merge offline→online determinístico, sem perda de dados.
**Critério de conclusão:** Editar nota no celular offline, reconectar, ver merge correto no desktop sem conflito manual.
**Estimativa:** Semanas 17–20

- [ ] CRDT Automerge 2.0: cada Block com seu próprio documento (`crdt_state`).
- [ ] Sync server com Hocuspocus (WebSocket + awareness).
- [ ] Indicador de presença (quem está editando qual Block).
- [ ] Histórico de versões via log de patches Automerge (time-travel).
- [ ] Estratégia de merge para `canvas_nodes` (posição = Last Write Wins é aceitável).
- [ ] Compactação periódica do `crdt_state` (GC de patches antigos).

---

## 🔵 F6 — Grafo Visual + Busca Semântica *(futura)*
**Objetivo:** Graph View de backlinks navegável e busca semântica ("encontre notas sobre X") funcionando online.
**Critério de conclusão:** Abrir Graph View e navegar pela rede de relações; busca retorna nota em inglês para query em português sobre o mesmo tema.
**Estimativa:** Semanas 21–24

- [ ] Graph View com D3.js Force Simulation sobre tabela `relations`.
- [ ] Filtros por tipo de relação e profundidade máxima.
- [ ] Pipeline de embeddings: chunking + OpenAI text-embedding-3-small + pgvector.
- [ ] Busca semântica no backend (cosine similarity + pgvector IVFFlat index).
- [ ] RRF fusion: keyword (FTS PostgreSQL) + semântico (pgvector) no backend.
- [ ] Indexação assíncrona com debounce (não bloqueia o editor).

---

## 🚫 Itens descartados desta visão

- **Colaboração em tempo real estilo Figma** — fora de escopo no MVP; collab básica (presença + sync) será entregue na F5, mas cursor compartilhado em tempo real é complexidade desproporcional para uso individual. Pode voltar ao IDEAS se o projeto escalar para times.
- **App desktop Electron/Tauri** — Web-First é suficiente com OPFS; Electron adicionaria distribuição, updates e assinatura de código. Avaliar pós-v1.0 se houver demanda.
- **CMS ou plataforma pública** — Fora de escopo. O projeto é ferramenta pessoal, não plataforma de publicação.
