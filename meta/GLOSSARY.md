# GLOSSARY.md — Termos do Projeto Knowledge OS

> Termos próprios deste projeto que se repetem entre sessões.
> Só o que não é óbvio para alguém de fora.

---

## Conceitos do projeto

- **Block** — Entidade universal de dados do sistema. Tudo é um Block: nota, página, database, canvas, card. Distinguidos pelo campo `type`. Uma nota existe como um único Block e pode ser projetada em múltiplas visões sem duplicação.

- **Projeção** — Uma visão de um Block sem duplicar seus dados. O canvas "projeta" um Block numa posição x,y; a tabela "projeta" o mesmo Block como uma linha. Editar qualquer projeção edita o Block original.

- **Frustum Culling** — Técnica de não renderizar no DOM nós do canvas que estão fora do viewport visível. Implementado com RBush (spatial index). Permite 10k+ nós sem queda de performance.

- **LOD (Level of Detail)** — Nível de detalhe de renderização de um shape no canvas, calculado pelo tamanho em pixels na tela. `full` = editor completo; `thumb` = imagem estática do conteúdo; `dot` = círculo colorido. Quanto mais zoom out, menor o LOD.

- **RRF (Reciprocal Rank Fusion)** — Algoritmo para fundir resultados de múltiplas fontes de busca (keyword + semântico) num ranking único. Fórmula: `score = 1/(60+rank_A) + 1/(60+rank_B)`. Os 60 é uma constante de suavização.

- **Online-First (single-user)** — Princípio arquitetural deste projeto desde 2026-06-26 (ver DEC-011): o Postgres hospedado (Supabase) é a única fonte de verdade, acessível de qualquer dispositivo com internet. Substitui o modelo "Local-First" original (offline com sincronização), descartado por não haver requisito real de edição offline para um usuário único.

- **Wikilink** — Sintaxe `[[Nome da Nota]]` digitada no Tiptap que cria automaticamente uma `relation` do tipo `mention` entre o Block atual e o Block referenciado.

---

## Arquiteturas / módulos

- **CanvasApp** — Componente raiz do canvas. Inicializa todos os providers (WorkspaceProvider, SyncProvider, SearchProvider).

- **CanvasShell** — Layout manager: sidebar + canvas + inspector. Gerencia hotkeys globais e estado dos painéis.

- **CanvasView** — Motor de canvas. Integra o tldraw v3, registra ShapeUtils customizados, aplica frustum culling.

- **ShapeUtil** — Classe do tldraw que define como um tipo de shape é renderizado, como reage a resize, e qual é sua hitbox. `NoteShapeUtil` e `DatabaseShapeUtil` são ShapeUtils customizados deste projeto.

- **HTMLContainer** — Componente do tldraw que permite renderizar DOM nativo (React components) dentro do canvas SVG. Usado pelo NoteShapeUtil para embeder o editor Tiptap.

- **NodeInspector** — Painel lateral que aparece ao selecionar um nó. Exibe propriedades, backlinks, histórico de versões e opções de estilo.

- **SearchPalette** — Modal ativado por ⌘K. Executa busca no índice Orama local com < 5ms.

- **`wa-sqlite`** *(termo histórico — descartado, ver DEC-011)* — biblioteca que compilaria SQLite para WASM no browser; chegou a ser planejada (DEC-003, superada) mas nunca implementada. Mantido aqui só para quem encontrar a referência em logs antigos.

- **Automerge / CRDT** *(termo histórico — descartado, ver DEC-011)* — biblioteca de sincronização com resolução automática de conflito; planejada (DEC-004, superada) para um cenário multi-dispositivo offline que não se aplica a um projeto single-user online-first. `packages/crdt` (esqueleto criado na F0) foi removido do monorepo.

---

## Comandos / artefatos

- **`useVisibleNodes(canvasId)`** — Hook que consulta o RBush spatial index e retorna IDs dos nós visíveis no viewport atual. É a peça-chave do frustum culling.

- **`useBlock(blockId)`** — Hook reativo que lê um Block do backend (via `apps/api`, que lê do Postgres) e re-renderiza quando o Block muda. Base de todos os shapes e visões.

- **`useBacklinks(blockId)`** — Hook que faz query em `relations WHERE to_block = blockId` e retorna todos os Blocks que mencionam o Block atual.

---

## Identificadores

- **`blk_`** — Prefixo de IDs de Block. Ex: `blk_x7k2m`. Gerados com nanoid.
- **`cnv_`** — Prefixo de IDs de Canvas (que é um Block de type='canvas').
- **`rel_`** — Prefixo de IDs de Relation.
- **`DEC-N`** — Identificador de decisão arquitetural em DECISIONS.md.
- **`FIX-N`** — Identificador de bug grave resolvido em DECISIONS.md.
- **`F0–F6`** — Fases do ROADMAP.
