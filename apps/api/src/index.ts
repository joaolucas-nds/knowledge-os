import { createDb } from "@knowledge-os/db";
import { buildApp } from "./app.js";
import { loadEnv } from "./env.js";

async function main(): Promise<void> {
  const env = loadEnv();

  const dbHandle = env.databaseUrl
    ? createDb({ connectionString: env.databaseUrl })
    : undefined;

  const app = await buildApp({ env, db: dbHandle?.db });

  // Shutdown gracioso: fecha o Fastify e o Pool do Postgres antes de
  // sair, para não deixar conexões TCP penduradas em redeploys/CI.
  const shutdown = async (signal: string) => {
    app.log.info(`Recebido ${signal}, encerrando graciosamente...`);
    await app.close();
    if (dbHandle) await dbHandle.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await app.listen({ port: env.port, host: env.host });
    if (!dbHandle) {
      app.log.warn(
        "DATABASE_URL não definido — API rodando sem banco (esperado nesta F0 até a Fase 0 ser concluída).",
      );
    }
  } catch (error) {
    app.log.error(error, "Falha ao iniciar o servidor");
    process.exit(1);
  }
}

void main();
