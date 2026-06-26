/**
 * Schema Drizzle — F0 (Fundação Técnica).
 *
 * Escopo desta fase: apenas `blocks` e `relations`, conforme o ROADMAP (F0).
 * As demais tabelas do modelo completo (canvas_nodes, canvas_edges,
 * database_schemas, search_vectors) chegam em F2/F3/F6 — não as criamos
 * agora para não versionar schema "morto" sem código que o use.
 *
 * Ver DECISIONS.md:
 *   - DEC-002 ("Tudo é um Block" como entidade universal)
 *   - DEC-003 (Local-First com wa-sqlite + OPFS — este schema é o espelho
 *     Postgres/backend; o schema local-first em SQLite é replicado por
 *     migrations equivalentes em apps/web/lib/sqlite, ainda não criado)
 */

import {
  pgTable,
  text,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations as defineRelations } from "drizzle-orm";

/**
 * Tipos de Block suportados. Mantido como union de string (não enum do
 * Postgres) de propósito: adicionar um novo tipo de Block não deve exigir
 * uma migration de enum — só um novo valor de `type` e um novo componente
 * React (ver CONTEXT.md, "Como o modelo de dados funciona").
 */
export const BLOCK_TYPES = [
  "page",
  "note",
  "database",
  "canvas",
  "card",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

/**
 * Entidade universal do sistema (DEC-002). Uma nota, uma página, uma
 * database e um canvas são todos um `Block` — só o `type` muda o
 * comportamento de renderização no frontend.
 *
 * IMPORTANTE (armadilha #4 do CONTEXT.md): este registro nunca é
 * duplicado em outra tabela. `canvas_nodes` (F2) referenciará
 * `block_id` e guardará apenas posição/estilo — nunca conteúdo.
 */
export const blocks = pgTable(
  "blocks",
  {
    id: text("id").primaryKey(),
    type: text("type").$type<BlockType>().notNull(),

    /** Documento Tiptap/ProseMirror serializado (null para tipos sem corpo rico, ex.: database). */
    content: jsonb("content"),

    /** Campos dinâmicos estilo Notion (ex.: propriedades de Database, ai_summary). */
    properties: jsonb("properties").notNull().default({}),

    /** Auto-referência para hierarquia de páginas (sidebar tree). */
    parentId: text("parent_id").references((): AnyPgColumn => blocks.id, {
      onDelete: "set null",
    }),

    workspaceId: text("workspace_id").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /** Soft delete — nunca DELETE físico, para não quebrar relations/backlinks. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    /**
     * Documento Automerge serializado (BYTEA → aqui modelado como bytes
     * via "text" base64 seria impreciso; usamos jsonb apenas como
     * placeholder estrutural nesta F0 — a coluna real BYTEA e a
     * integração com @automerge/automerge ficam para a F5, junto com
     * packages/crdt. Não escrever nesta coluna antes da F5).
     */
    crdtState: jsonb("crdt_state"),
  },
  (table) => [
    index("idx_blocks_parent").on(table.parentId),
    index("idx_blocks_workspace").on(table.workspaceId),
    index("idx_blocks_type").on(table.type),
  ],
);

/**
 * Grafo de relações entre Blocks — backlinks, menções (wikilinks),
 * hierarquia explícita e relations de Database (F3).
 */
export const relations_ = pgTable(
  "relations",
  {
    id: text("id").primaryKey(),
    fromBlock: text("from_block")
      .notNull()
      .references(() => blocks.id, { onDelete: "cascade" }),
    toBlock: text("to_block")
      .notNull()
      .references(() => blocks.id, { onDelete: "cascade" }),

    /** 'link' | 'mention' | 'parent' | 'embed' | 'custom' — string livre por ora (ver BLOCK_TYPES). */
    relationType: text("relation_type").notNull(),

    metadata: jsonb("metadata").notNull().default({}),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_relations_triplet").on(
      table.fromBlock,
      table.toBlock,
      table.relationType,
    ),
    index("idx_relations_from").on(table.fromBlock),
    index("idx_relations_to").on(table.toBlock),
  ],
);

/**
 * Relational API do Drizzle (não é FK — é só para habilitar
 * `db.query.blocks.with({ children: true })` etc. no futuro).
 * Ver armadilha registrada em DECISIONS futuras: relations() não é
 * constraint, a FK real está em `.references()` acima.
 */
export const blocksRelations = defineRelations(blocks, ({ many, one }) => ({
  children: many(blocks, { relationName: "parentChild" }),
  parent: one(blocks, {
    fields: [blocks.parentId],
    references: [blocks.id],
    relationName: "parentChild",
  }),
  outgoingRelations: many(relations_, { relationName: "fromBlock" }),
  incomingRelations: many(relations_, { relationName: "toBlock" }),
}));

export const relationsRelations = defineRelations(relations_, ({ one }) => ({
  from: one(blocks, {
    fields: [relations_.fromBlock],
    references: [blocks.id],
    relationName: "fromBlock",
  }),
  to: one(blocks, {
    fields: [relations_.toBlock],
    references: [blocks.id],
    relationName: "toBlock",
  }),
}));

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;
export type Relation = typeof relations_.$inferSelect;
export type NewRelation = typeof relations_.$inferInsert;
