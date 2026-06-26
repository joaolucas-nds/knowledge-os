# HISTORICO.md — Conhecimento Consolidado

> Arquivo-baú para conhecimento denso já aprendido e estável — análises, guias e pesquisas
> que tornariam o CONTEXT pesado demais. Lido sob demanda quando o assunto aparece.

---

## 1. Benchmark de Ferramentas do Mercado (2026-06-05)

Análise das 14 ferramentas avaliadas antes de iniciar o projeto, identificando o gap que o Knowledge OS preenche.

### Tabela consolidada

| Ferramenta | Modelo de Preço | Notas Ricas | Canvas Livre | Busca | Fluxogramas/DB |
|---|---|---|---|---|---|
| Milanote | Falso Grátis (100 itens) | ✅ Boards visuais | ⚠️ Básico | ❌ Superficial | ⚠️ Manual |
| Miro | Falso Grátis (3 boards) | ⚠️ Sticky notes | ✅ Bom freehand | ⚠️ Só títulos | ✅ Excelente |
| Draw.io | Gratuito para Sempre | ❌ Sem notas | ❌ Ausente | ❌ Inexistente | ✅ Referência |
| Lucidchart | Falso Grátis (3 docs) | ❌ Sem suporte | ❌ Ausente | ⚠️ Básico | ✅ Completo |
| Canva Fluxograma | Falso Grátis | ⚠️ Superficial | ❌ Ausente | ❌ Fraco | ⚠️ Templates |
| FigJam | Falso Grátis (3 boards) | ⚠️ Stickies | ✅ Bom | ❌ Fraco | ⚠️ Básico |
| Figma | Falso Grátis (3 projetos) | ❌ Não é foco | ✅ Vetorial | ⚠️ Por layer | ✅ Com plugins |
| Mural | Falso Grátis (trial) | ⚠️ Cards | ✅ Bom | ❌ Fraco | ⚠️ Templates |
| Obsidian Canvas | Gratuito para Sempre | ✅ Markdown nativo | ❌ Ausente | ✅ Excelente | ❌ Ausente |
| Heptabase | Pago (US$ 11.99/mês) | ✅ Cards + Whiteboard | ❌ Básico | ✅ Muito bom | ❌ Limitado |
| Whimsical | Falso Grátis (1k objetos) | ⚠️ Docs simples | ❌ Ausente | ⚠️ Básico | ✅ Excelente UX |
| Scapple | Pago (one-time) | ✅ Notas livres | ❌ Ausente | ❌ Fraco | ❌ Ausente |
| Notion | Falso Grátis (5MB) | ✅ Blocks + DB | ❌ Ausente | ✅ Bom | ❌ Sem canvas |
| Logseq | Gratuito para Sempre | ✅ Outliner + Graph | ⚠️ Canvas básico | ✅ Full-text | ❌ Ausente |

### Gap identificado

**Nenhuma ferramenta entrega simultaneamente:**
1. Notas ricas com editor avançado (Tiptap/ProseMirror level)
2. Canvas infinito com shapes que são editores completos (não sticky notes)
3. Grafo de relações / backlinks navegável
4. Tabelas relacionais (Notion Database level)
5. Busca semântica + full-text offline
6. Sem limitações de plano gratuito

Heptabase chega mais perto (notas + canvas + busca), mas é pago, sem database relacional e sem busca semântica. O Knowledge OS ocupa exatamente este espaço.

---

## 2. Análise de Engines de Canvas (2026-06-05)

Pesquisa realizada antes de escolher o tldraw v3 (ver DEC-001).

### tldraw v3
- **Licença:** MIT (core) + BSL para features enterprise
- **Renderização:** SVG + HTML overlay via `HTMLContainer`
- **ShapeUtil:** sistema extensível para shapes customizados com tipagem TypeScript forte
- **Performance:** zoom/pan via CSS transform (GPU); shapes podem ter hitbox e indicador separados
- **Undo/redo:** sistema nativo via patches; integra com stores externos
- **Exportação:** SVG, PNG, clipboard
- **Tamanho do bundle:** ~400KB gzipped (com tree-shaking)
- **Ponto crítico:** versão 3 quebrou APIs da v2; migração não é trivial; verificar antes de atualizar

### React Flow (rejeitado)
- Ótimo para grafos de nós fixos (pipelines, workflows)
- Não suporta freehand draw
- Sem zoom/pan livre estilo canvas de brainstorming
- Shapes são componentes React comuns — sem sistema de hitbox/resize nativo

### Konva.js (rejeitado)
- Canvas 2D puro; não suporta DOM dentro dos shapes
- Impossível embeder editor de texto rico sem reimplementar tudo
- Performance boa para gráficos simples, não para shapes com estado complexo

### Excalidraw como lib (rejeitado)
- Focado em desenho à mão (estética de quadro branco)
- API de shapes customizados limitada e não documentada para uso externo
- Não suporta embeds de componentes React complexos

---

## 3. Análise de Opções de Persistência Local no Browser (2026-06-05)

Pesquisa antes de escolher wa-sqlite + OPFS (ver DEC-003).

### wa-sqlite + OPFS (escolhido)
- SQLite completo no browser via WASM
- OPFS: escrita de arquivos locais sem limite prático, assíncrona, sem prompt ao usuário
- Suporte a WAL mode (write-ahead logging) para melhor performance de escrita
- FTS5 embutido (full-text search offline)
- Roda em Web Worker (não bloqueia a thread principal)
- Compatibilidade: Chrome 86+, Firefox 111+, Safari 15.2+

### IndexedDB (rejeitado para dados relacionais)
- API nativa do browser; sem limite de tamanho (prático)
- Sem SQL, sem FTS; queries complexas em JavaScript são verbosas e lentas
- Adequado para armazenar blobs e documentos simples, não para o core de um PKM

### localStorage (rejeitado)
- Limite de 5MB; síncrono e bloqueante
- Inviável para qualquer volume de notas

### sql.js (rejeitado)
- SQLite em WASM mas in-memory apenas
- Dados perdidos ao fechar a aba; sem persistência real
- Não suporta OPFS

### PouchDB (rejeitado)
- Abstração sobre IndexedDB; sincroniza com CouchDB
- Sem SQL nativo, sem FTS5
- Modelo de documento JSON — adequado para sync simples, não para queries relacionais

---

## 4. Análise de Estratégias de Busca (2026-06-05)

Pesquisa antes de definir a arquitetura de busca (ver DEC-005 e DEC-006).

### Benchmarks de bibliotecas client-side

| Biblioteca | BM25 | Stemming | Highlight | Vetor | Tamanho |
|---|---|---|---|---|---|
| Orama 3.x | ✅ | ✅ PT/EN | ✅ | ✅ (embutido) | ~45KB |
| Minisearch | ✅ | ✅ | ✅ | ❌ | ~20KB |
| Fuse.js | ❌ (fuzzy) | ❌ | ⚠️ | ❌ | ~10KB |
| Lunr.js | ✅ | ✅ | ❌ | ❌ | ~30KB (descontinuado) |

Orama escolhido por ser o único com vetor embutido (preparação para busca semântica local futura) e por ter stemming em português nativo.

### Estratégia de embeddings

- **Modelo escolhido:** `text-embedding-3-small` da OpenAI (1536 dimensões)
  - Custo: ~$0.02 por 1M tokens (muito mais barato que o large)
  - Qualidade: suficiente para busca semântica de notas pessoais
- **Alternativa local (futura):** Nomic Embed Text v1.5 rodando via Transformers.js no browser
  - Vantagem: zero custo, zero latência, 100% offline
  - Desvantagem: modelo maior (~80MB download inicial); qualidade levemente inferior
- **Chunking:** 512 tokens com overlap de 50 tokens, quebras em limites de parágrafo/sentença
- **Armazenamento:** pgvector com índice IVFFlat (cosine ops) para queries < 50ms
