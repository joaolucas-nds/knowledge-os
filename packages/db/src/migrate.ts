/**
 * Executor de migrations via API programática do Drizzle (não a CLI).
 *
 * POR QUÊ ESTE ARQUIVO EXISTE (ver FIX-003 em DECISIONS.md):
 * `drizzle-kit migrate` (a CLI, chamada antes por este script via
 * `db:migrate`) tem um bug conhecido e ainda não corrigido nas versões
 * estáveis 0.x — quando a migration falha por QUALQUER motivo (erro de
 * SQL, senha errada, host inalcançável, etc.), a CLI engole o erro real
 * e só imprime "Exit status 1" sem nenhuma mensagem. Reproduzido e
 * confirmado nesta sessão com as versões exatas deste projeto
 * (drizzle-kit 0.31.10 + drizzle-orm 0.45.2) — ver também
 * drizzle-team/drizzle-orm issues #5521, #5601, #5816, #5520 (corrigido
 * só na linha beta 1.0, nunca retroportado para 0.x).
 *
 * Rodando via `migrate()` programático — a própria API pública que a
 * CLI usa por baixo, documentada pelo time do Drizzle como alternativa —
 * o erro real aparece no console, porque o catch abaixo o imprime
 * explicitamente em vez de depender da view de progresso quebrada da CLI.
 *
 * `db:generate` e `db:studio` continuam usando a CLI normalmente — o bug
 * é específico do comando `migrate` (que fala com o banco); os outros
 * dois só leem/mostram schema, não aplicam SQL.
 */

import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./client.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "[migrate] DATABASE_URL não está definido. Copie packages/db/.env.example " +
      "para packages/db/.env e preencha com a connection string real do Supabase " +
      "(ver SETUP.md).",
  );
  process.exit(1);
}

const { db, close } = createDb({ connectionString: databaseUrl });

console.log("[migrate] Conectando e aplicando migrations de ./drizzle ...");

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] ✓ Migrations aplicadas com sucesso.");
} catch (error) {
  // Este é o ponto que a CLI do drizzle-kit não tem: o erro real,
  // completo, sem ser escondido por uma view de progresso quebrada.
  console.error("[migrate] ✗ Falha ao aplicar migrations:");
  console.error(error);
  process.exitCode = 1;
} finally {
  await close();
}
