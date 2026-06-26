/**
 * @knowledge-os/crdt — ESQUELETO.
 *
 * Este package existe nesta F0 apenas para reservar o lugar no monorepo
 * e fixar a dependência (@automerge/automerge). Nenhuma das funções
 * abaixo é usada em produção ainda — a sincronização CRDT real (merge
 * determinístico, sync com Hocuspocus, compactação periódica) é escopo
 * da F5 do ROADMAP, conforme DEC-004.
 *
 * AVISO DE VERSÃO (ver sessão de 2026-06): a DEC-004 foi escrita
 * referenciando "Automerge 2.0". Ao resolver a dependência contra o
 * npm registry nesta sessão, a versão atual é @automerge/automerge ^3.x.
 * A API de alto nível (Automerge.change/merge/save) é estável entre
 * essas major versions, mas a DEC-004 deve ser revisitada com a API
 * exata da v3 quando a F5 for implementada — não assumir que o que
 * está aqui é a integração final.
 */

import * as Automerge from "@automerge/automerge";

/**
 * Formato mínimo de um documento CRDT de Block — apenas o suficiente
 * para o tipo compilar. Será expandido na F5 para refletir o schema
 * real de `content`/`properties` do Block (ver packages/db/src/schema.ts).
 */
export interface BlockCrdtDoc {
  content: string;
  // Index signature exigida por Automerge.from<T>() (T extends Record<string, unknown>).
  // Vai embora quando o shape real do documento for definido na F5.
  [key: string]: unknown;
}

/**
 * Cria um novo documento Automerge vazio para um Block.
 *
 * @remarks Placeholder de F0 — ainda não é chamado por nenhum código de
 * produção. Existe para validar que a dependência resolve e tipa
 * corretamente dentro do monorepo (typecheck do turbo).
 */
export function createBlockDoc(initialContent = ""): Automerge.Doc<BlockCrdtDoc> {
  return Automerge.from<BlockCrdtDoc>({ content: initialContent });
}

/**
 * Funde dois documentos do mesmo Block (ex.: edição offline vs. remota).
 *
 * @remarks Placeholder de F0. A F5 vai decidir onde esse merge roda
 * (cliente, servidor Hocuspocus, ou ambos) e como o resultado é
 * persistido de volta em `blocks.crdt_state`.
 */
export function mergeBlockDocs(
  local: Automerge.Doc<BlockCrdtDoc>,
  remote: Automerge.Doc<BlockCrdtDoc>,
): Automerge.Doc<BlockCrdtDoc> {
  return Automerge.merge(local, remote);
}
