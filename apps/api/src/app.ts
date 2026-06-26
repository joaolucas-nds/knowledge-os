/**
 * Factory da aplicação Fastify.
 *
 * Separado de `index.ts` (que faz o boot real e o `listen`) para permitir
 * testes de integração que montam a app sem abrir uma porta de rede
 * (`app.inject()` do próprio Fastify) — ver "Sinaliza o que testar" no
 * CLAUDE.md/CEREBRO.md: este é exatamente o ponto de entrada que uma
 * suíte de testes (ainda não criada) deve exercitar primeiro.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import type { Database } from "@knowledge-os/db";
import type { ApiEnv } from "./env.js";

export interface BuildAppOptions {
  env: ApiEnv;
  /** Opcional nesta F0: permite health check funcionar mesmo sem banco configurado. */
  db?: Database;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  await app.register(cors, {
    origin: options.env.corsOrigins.includes("*") ? true : options.env.corsOrigins,
  });

  await app.register(rateLimit, {
    global: true,
    max: options.env.rateLimitMax,
    timeWindow: options.env.rateLimitWindowMs,
  });

  app.get("/health", async () => {
    return {
      status: "ok" as const,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  });

  app.get("/health/db", async (_request, reply) => {
    if (!options.db) {
      return reply.code(503).send({
        status: "not_configured" as const,
        message: "DATABASE_URL não foi definido — API rodando sem banco.",
      });
    }

    try {
      // Query mínima só para validar que o Pool responde — não depende
      // de nenhuma tabela existir ainda (schema pode não ter sido
      // migrado neste ambiente).
      await options.db.execute("select 1");
      return { status: "ok" as const };
    } catch (error) {
      app.log.error(error, "Falha no health check do banco");
      return reply.code(503).send({
        status: "error" as const,
        message: "Banco configurado mas inacessível — ver logs do servidor.",
      });
    }
  });

  return app;
}
