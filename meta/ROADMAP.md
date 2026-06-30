# ROADMAP.md — Plano de Evolução do Knowledge OS

> Plano deliberado em fases. Cada fase tem objetivo e critério de conclusão claro.
> Estado: 🟢 concluída · 🟡 em curso/próxima · 🔵 futura · 🚫 descartada.
> Médio e longo prazo vivem AQUI, não no STATUS.

---

## 🟡 F0 — Fundação Técnica *(em curso)*
**Objetivo:** Repositório existindo, stack rodando, autenticação funcional. "Hello World" persistido no Postgres hospedado, acessível de qualquer máquina.
**Critério de conclusão:** `apps/web` e `apps/api` rodando; Postgres no Supabase com a migration aplicada; primeiro Block criado e persistido lá; login via Supabase Auth funcionando.
**Estimativa:** Semanas 1–2

- [x] Criar repositório com estrutura Turborepo (`apps/web`, `apps/api`, `packages/db`, `packages/ui`) — pnpm workspaces (ver DEC-008).
- [x] Configurar TypeScript strict em todos os packages.
- [x] Schema Drizzle inicial: tabelas `blocks` e `relations` — migration gerada e aplicada contra Postgres real (local, para validação).
- [x] API REST base com Fastify (health check, CORS, rate limit).
- [x] Criar conta e projeto no Supabase (banco + Auth + Storage) — guia em SETUP.md.
- [x] Ajuste de SSL automático no `client.ts` (`shouldUseSsl`) — pronto para apontar a `DATABASE_URL` para o Supabase assim que o projeto existir; reaplicar a migration lá fica pendente até então.
- [x] Login single-user com Supabase Auth implementado e validado (`@supabase/ssr` no `apps/web`, `@fastify/jwt` no `apps/api` — ver DEC-012/DEC-014). Falta só testar contra um projeto Supabase real (ver STATUS.md).
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

## 🔵 F5 — Deploy em Produção *(futura)*
**Objetivo:** Sair do "só roda na minha máquina" para acessível de qualquer dispositivo, de verdade — backend sempre ligado, frontend publicado, domínio próprio se quiser.
**Critério de conclusão:** Abrir o app a partir do celular ou de outro PC, logar com Supabase Auth, e ver as mesmas notas/canvas de sempre.
**Estimativa:** Semanas 17–18
**Nota:** esta fase **substitui** a "F5 — Sincronização e Colaboração via CRDT" do plano original — ver DEC-011 (CRDT deixou de ser necessário para um projeto single-user online-first).

- [ ] Deploy do `apps/api` num host sempre ligado com tier grátis (Render ou Fly.io — escolher na implementação).
- [ ] Deploy do `apps/web` na Vercel (ver DEC-013), com as variáveis de ambiente de produção (Supabase URL/keys, URL do `apps/api`).
- [ ] Configurar CORS do `apps/api` para aceitar o domínio de produção da Vercel.
- [ ] (Opcional) Domínio próprio em vez do subdomínio gratuito da Vercel.
- [ ] (Opcional) Supabase Realtime: refletir mudanças automaticamente entre abas/dispositivos abertos ao mesmo tempo, sem precisar recarregar a página — alternativa simples ao que o CRDT resolveria de forma muito mais complexa.

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

- **CRDT (Automerge) + sincronização offline (wa-sqlite/OPFS)** — descartado em 2026-06-26: resolvia conflito de edição concorrente offline, cenário que não existe num projeto single-user online-first. Ver DEC-011 (supera DEC-003 e DEC-004). `packages/crdt` removido do monorepo.
- **Colaboração em tempo real estilo Figma** — fora de escopo: cursor compartilhado em tempo real é complexidade desproporcional para uso individual. Pode voltar ao IDEAS se o projeto escalar para times (não é o plano).
- **App desktop Electron/Tauri** — o modelo online-first já cobre "acesso de qualquer máquina" via navegador; Electron adicionaria distribuição, updates e assinatura de código sem necessidade clara. Avaliar pós-v1.0 se houver demanda.
- **CMS ou plataforma pública** — Fora de escopo. O projeto é ferramenta pessoal, não plataforma de publicação.
