# IDEAS.md — Brainstorm e Visão

> **Segundo cérebro** do projeto. Captura TUDO que for mencionado, mesmo solto ou no meio de outro assunto.
> Nunca perde: ideia implementada vai para «Concluídas»; ideia recusada vai para «Descartadas» com o motivo.

---

## 💡 Ideias Ativas — Usuário

### 2026-06 — Ferramenta própria de gestão do conhecimento
Criar uma ferramenta 100% própria que una o melhor do Obsidian (grafo), Notion (tabelas), Miro (canvas) e Heptabase (cards no whiteboard). Web-First, Offline-First, sem limitações de plano.

### 2026-06 — Canvas infinito com notas textuais embebidas
Canvas onde as notas não são só sticky notes com texto plano — são editores ricos completos (Tiptap), com slash commands e wikilinks, vivendo diretamente na superfície do canvas.

### 2026-06 — Banco de dados relacional no canvas
Arrastar uma Database (tabela Notion-like) para o canvas e ela funcionar como um shape arrastável e redimensionável — mas com dados reais, filtrável e editável inline.

### 2026-06 — Busca semântica ("encontre notas sobre transformers")
Busca que entende o significado, não só palavras-chave. Digitar "aprendizado de máquina" e encontrar notas escritas em inglês sobre "machine learning".

### 2026-06 — Grafo visual de relações
Graph View (estilo Obsidian) mostrando a rede de backlinks entre notas, renderizado com D3.js Force Simulation. Filtros por tipo de relação e profundidade de nós.

---

## 🤖 Ideias Ativas — Assistente

### 2026-06-05 — Level-of-Detail automático no canvas (LOD)
Ao dar zoom out, nós pequenos na tela viram thumbnails estáticos (imagem do conteúdo) e depois simples pontos coloridos. Evita renderizar o editor Tiptap em nós que mal aparecem na tela. Implementação: `useLevelOfDetail()` com três estados `full | thumb | dot`.

### 2026-06-26 — Offline básico via fila de escrita (adiada, não descartada)
Surgiu na discussão da DEC-011: se um dia houver necessidade real de editar sem internet, não precisa reviver o aparato de CRDT/Automerge. Uma fila local simples (Service Worker + IndexedDB guardando as mutações feitas offline) que reenvia ao servidor quando a conexão volta resolve o caso de uso "editei no avião" sem precisar de merge automático — sendo single-user, duas edições concorrentes são raras o suficiente para tratar manualmente se acontecer (avisar "isso foi editado em outro lugar, escolha qual versão manter"), em vez de exigir resolução automática de conflito.

### 2026-06-05 — Índice Orama particionado para workspaces grandes
Para workspaces com >50k Blocks, o índice Orama inteiro em RAM pode pesar 2.5MB+. Avaliar estratégia de particionamento por "espaço" ou tipo — indexar primeiro os Blocks ativos (abertos recentemente) e carregar os demais sob demanda.

### 2026-06-05 — Plugin system para custom ShapeUtils
Como o tldraw já suporta ShapeUtil extensível, expor uma API de plugins que permite registrar novos shapes sem alterar o core. Exemplo: shape de mapa mental, shape de linha do tempo, shape de código executável (REPL).

### 2026-06-05 — Export de canvas como SVG/PNG/PDF
Aproveitar a capacidade nativa do tldraw de exportar o canvas como SVG e adicionar opções de área de exportação (seleção atual, página completa, região customizada). Útil para compartilhar diagrams sem dar acesso ao app.

### 2026-06-05 — AI Summary automático por nota
Pipeline opcional: ao salvar um Block, gerar um resumo de 2-3 frases via LLM e armazenar em `properties.ai_summary`. Exibir no card do canvas quando em modo `thumb` (LOD). Permite ler o conteúdo de uma nota sem abrir o editor.

### 2026-06-05 — Modo apresentação no canvas
Permite criar uma sequência de "câmeras" (viewports nomeados) no canvas e navegar entre elas como slides. Útil para apresentar um diagrama ou mapa mental para outra pessoa, guiando o zoom e pan.

### 2026-06-05 — Backlinks bidirecionais automáticos via wikilinks
Ao digitar `[[Nome da Nota]]` no Tiptap, criar automaticamente uma entrada em `relations` com `relation_type='mention'`. Ao deletar o wikilink, remover a relação. O BacklinksPanel do inspector exibe todas as notas que mencionam a nota atual em tempo real.

### 2026-06-26 — Conversão retroativa de texto selecionado em wikilink (menu de contexto + preview)
Refinamento trazido pelo usuário sobre a ideia acima: além do fluxo de **digitar** `[[` e abrir o autocomplete (já coberto no ROADMAP F1), existe um segundo padrão de interação — **selecionar um texto já escrito**, abrir o menu de contexto (botão direito), escolher algo como "Localizar referência", o sistema busca Blocks/notas cujo título bate com o texto selecionado, e mostra um **preview** das opções para o usuário escolher antes de converter a seleção num wikilink real.
São dois fluxos distintos (escrever novo vs. religar texto antigo já existente) e o segundo não é coberto pela ideia original. Pesquisa rápida de mercado: nem o Obsidian (a referência madura em wikilinks) faz isso nativamente — o autocomplete nativo dele só cobre o fluxo de digitação; a conversão retroativa de texto selecionado para link existente é território de plugins de terceiros (ex.: "Various Complement", "Automatic Linker", "Virtual Linker"), não comportamento padrão de nenhuma ferramenta mainstream. Ou seja: é uma feature genuinamente diferenciadora se bem executada, mas também é a parte que historicamente fica de fora do core até em ferramentas maduras — vale planejar como um item de UX explícito na F1 (não assumir que "vem de brinde" junto do autocomplete de digitação), provavelmente como uma ação no menu de seleção do Tiptap chamando a busca Orama (já client-side e <5ms) para popular o preview.

---

## 📦 Feedback para o Kit

### 2026-06-24 — CLAUDE.md renomeado para CEREBRO.md (+ workflow ASU adicionado)
O usuário sinalizou nesta sessão que o arquivo de comportamento do Kit de Contexto, antes `CLAUDE.md`, passou a se chamar `CEREBRO.md` neste projeto. Comparando os dois arquivos disponíveis no Projeto: o conteúdo é quase idêntico (mesmos 19 princípios, mesma tabela de gatilhos, mesmas regras de higiene), mas o `CEREBRO.md` tem uma seção nova que o `CLAUDE.md` original não tinha — **"Saída de código via ASU (patch)"**: mudanças de código passam a ser entregues como instrução YAML do Atualizador Automático de Scripts (`INSTRUCTION_GUIDE.md`), não como arquivos inteiros, com preferência por edições cirúrgicas (`replace_function`/`replace_method`/`replace_context_block`) sobre reescrever arquivos. Isso é uma evolução real do Kit, não só um rename cosmético — vale levar de volta: (1) o nome do arquivo de comportamento pode variar por projeto (não assumir sempre "CLAUDE.md"); (2) o workflow ASU como alternativa à entrega de "arquivo completo" parece um padrão maduro o suficiente para o Kit considerar como opção oficial em projetos de código.
**Aplicado nesta sessão:** o trabalho de F0 desta sessão foi greenfield (bootstrap de um monorepo novo, dezenas de arquivos novos) — não fazia sentido forçar isso em instruções ASU (que são uma ferramenta de *patch* para codebase já existente). Assumida e declarada a interpretação: para criação inicial de repositório, entregar os arquivos reais (validados rodando typecheck/lint/build de verdade); para edições futuras em código já existente neste projeto, usar ASU conforme `CEREBRO.md`/`PROMPT_IA.md` pedem.

### 2026-06-26 — Arquivo novo: SETUP.md (fora do conjunto padrão do kit)
O kit define um conjunto fixo de documentos (CONTEXT/STATUS/DECISIONS/CHANGELOG/IDEAS/ROADMAP/GLOSSARY/HISTORICO/LOG-TEMPLATE), todos voltados para o **assistente** reconstituir contexto entre sessões. Nenhum deles serve para o papel de "tutorial de onboarding para o humano configurar o ambiente do zero" (instalar Postgres, editar `.env`, troubleshooting de erros de conexão) — é conteúdo que o usuário segue uma vez, com a mão na massa, não algo que o assistente precisa reler toda sessão. Criado `SETUP.md` para esse papel específico, deixando claro no topo do arquivo que ele NÃO faz parte do ritual de leitura de início de sessão. Vale para o Kit considerar um décimo arquivo opcional nessa categoria ("guia de operação para humano", distinto de documentação de contexto para IA).

---
> Nenhuma ideia implementada ainda — projeto em fase de planejamento.

---

## ✅ Concluídas
> Nenhuma ideia implementada ainda — projeto em fase de planejamento.

---

## 🚫 Descartadas

- **Compactação periódica do `crdt_state` (CRDT/Automerge)** — descartada em 2026-06-26 junto com todo o aparato de CRDT (ver DEC-011): sem `crdt_state` no schema, não há o que compactar. Ideia original ficava obsoleta automaticamente com a remoção do `packages/crdt`.

- **Usar Elasticsearch como motor de busca principal** — descartado porque adiciona infra pesada e custo operacional alto para projeto individual; substituído por Orama (client) + pgvector (server) com RRF fusion, que entrega qualidade similar sem a complexidade operacional. (Ver DEC-006.)

- **Construir motor de canvas próprio do zero** — descartado pela estimativa de 4-6 meses de trabalho só para paridade com o que o tldraw v3 já entrega gratuitamente. (Ver DEC-001.)

- **PouchDB para persistência local** — descartado por não ter SQL nativo nem FTS5; substituído por wa-sqlite + OPFS. (Ver DEC-003.)

- **Repos separados para frontend e backend** — descartado pelo risco de divergência silenciosa de tipos TypeScript entre apps; substituído por monorepo Turborepo com `packages/db` como fonte única de verdade. (Ver DEC-007.)
