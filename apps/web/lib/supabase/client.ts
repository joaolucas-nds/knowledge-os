/**
 * Cliente Supabase para uso em Client Components (código que roda no browser).
 *
 * Usa `createBrowserClient` do `@supabase/ssr`, que persiste a sessão em
 * cookies legíveis pelo Next.js Middleware — o middleware usa esses cookies
 * para renovar o token de acesso antes que expire, sem exigir um round-trip
 * extra do usuário.
 *
 * Por que não é um singleton exportado diretamente: cada Client Component
 * que precisar do Supabase chama essa factory para garantir que o client
 * sempre lê as variáveis de ambiente de `process.env` em runtime, não em
 * build time.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
