/**
 * Factory de conexão Drizzle ORM (PostgreSQL via node-postgres).
 *
 * Por que factory e não um singleton exportado direto: apps/api precisa
 * controlar o ciclo de vida do Pool (abrir no boot, fechar no shutdown
 * gracioso). Um singleton instanciado no import time abriria conexões
 * de banco mesmo em testes que só importam tipos.
 */

import { Pool, type PoolConfig } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export type Database = NodePgDatabase<typeof schema>;

export interface CreateDbOptions {
  /** String de conexão completa, ex.: postgresql://user:pass@host:5432/db */
  connectionString: string;
  /** Repassado ao `pg.Pool` quando precisar de ajuste fino (ex.: ssl, max). */
  poolConfig?: Omit<PoolConfig, "connectionString">;
}

export interface DbHandle {
  db: Database;
  pool: Pool;
  /** Fecha o pool de conexões — chamar no shutdown gracioso do Fastify. */
  close: () => Promise<void>;
}

/**
 * Decide se a conexão precisa de SSL com base no host da connection string.
 *
 * Supabase (e a maioria dos provedores hospedados) exige SSL e tem um
 * certificado válido no pooler — `rejectUnauthorized: true` (o padrão do
 * Node) funciona sem configuração extra (confirmado: discussões da
 * comunidade Supabase desaconselham `rejectUnauthorized: false` em
 * produção, pois desabilita a verificação do certificado). Localhost
 * (desenvolvimento com Postgres local) não usa SSL.
 *
 * Detecção automática evita que cada chamador de `createDb` precise
 * lembrar de passar `poolConfig.ssl` manualmente — e ainda assim
 * `poolConfig` continua disponível para sobrescrever este comportamento
 * se um ambiente específico precisar (ex.: CA customizado via `ssl.ca`).
 */
function shouldUseSsl(connectionString: string): boolean {
  try {
    const { hostname } = new URL(connectionString);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    // Connection string malformada — deixa o erro real aparecer na
    // tentativa de conexão do pg, em vez de mascarar aqui.
    return false;
  }
}

/**
 * Cria uma instância de banco com seu próprio Pool de conexões.
 *
 * Armadilha conhecida (ver INSTRUCTION_GUIDE/HISTORICO de boas práticas
 * Drizzle): nunca instanciar isso dentro de um request handler — o Pool
 * deve ser criado uma vez no boot da aplicação e reaproveitado.
 */
export function createDb(options: CreateDbOptions): DbHandle {
  const pool = new Pool({
    connectionString: options.connectionString,
    ssl: shouldUseSsl(options.connectionString) ? true : undefined,
    ...options.poolConfig,
  });

  const db = drizzle(pool, { schema });

  return {
    db,
    pool,
    close: async () => {
      await pool.end();
    },
  };
}
