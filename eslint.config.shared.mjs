import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * Base de ESLint (flat config) compartilhada pelos packages Node puros
 * do monorepo: packages/db, packages/crdt, packages/ui e apps/api.
 *
 * apps/web NÃO importa este arquivo — tem seu próprio eslint.config.mjs
 * porque depende de eslint-config-next, cujos plugins transitivos
 * (eslint-plugin-react, eslint-plugin-jsx-a11y, eslint-plugin-import)
 * ainda travam o peer range em ESLint ^9. Os packages aqui usam ESLint
 * 10 sem esse problema — ver nota na sessão de scaffolding original
 * (`pnpm peers check` confirmou o conflito antes de decidirmos isso).
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Permite prefixo "_" para parâmetros/variáveis intencionalmente não usados
      // (comum em handlers Fastify como `(_request, reply) => ...`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "drizzle/**"],
  },
);
