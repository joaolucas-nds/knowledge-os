import type { NextConfig } from "next";

/**
 * Configuração mínima desta F0. Turbopack já é o bundler padrão no
 * Next.js 16 (dev e build) — não precisa de flag explícita.
 *
 * Quando a F2 (Canvas) chegar, revisar aqui: tldraw e Tiptap costumam
 * exigir ajustes de `transpilePackages` ou `serverExternalPackages`
 * dependendo de como publicam seus módulos.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
