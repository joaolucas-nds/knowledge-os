import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// DATABASE_URL vem de packages/db/.env (copie de .env.example).
// Em CI, este arquivo só é exercitado por `drizzle-kit generate`,
// que não abre conexão real — apenas lê o schema TypeScript.
const databaseUrl = process.env.DATABASE_URL ?? "";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
