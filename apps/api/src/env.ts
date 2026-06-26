/**
 * Leitura e validação mínima das variáveis de ambiente da API.
 *
 * Não usamos uma lib de schema (zod, etc.) aqui de propósito — nesta F0
 * o conjunto de variáveis é pequeno e estático. Se crescer (F3+ com
 * múltiplos serviços externos: R2, Redis, OpenAI), vale revisitar e
 * trocar por validação com zod, registrando a troca em DECISIONS.md.
 */

export interface ApiEnv {
  port: number;
  host: string;
  /** Origens permitidas para CORS, separadas por vírgula. "*" libera tudo (só usar em dev). */
  corsOrigins: string[];
  rateLimitMax: number;
  rateLimitWindowMs: number;
  /** Ausente = API sobe sem banco (útil para health check isolado em F0). */
  databaseUrl: string | undefined;
}

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const corsOriginsRaw = env.CORS_ORIGINS ?? "http://localhost:3000";

  return {
    port: parseIntEnv(env.PORT, 3001),
    host: env.HOST ?? "0.0.0.0",
    corsOrigins: corsOriginsRaw.split(",").map((origin) => origin.trim()),
    rateLimitMax: parseIntEnv(env.RATE_LIMIT_MAX, 100),
    rateLimitWindowMs: parseIntEnv(env.RATE_LIMIT_WINDOW_MS, 60_000),
    databaseUrl: env.DATABASE_URL,
  };
}
