import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * eslint-config-next já inclui suas próprias regras de TypeScript,
 * React e Core Web Vitals — não importamos eslint.config.shared.mjs
 * aqui (ver nota nesse arquivo sobre o conflito de peer dependency
 * com ESLint 10). `next lint` foi removido no Next.js 16; o comando
 * correto agora é `eslint` direto (ver package.json > scripts.lint).
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
