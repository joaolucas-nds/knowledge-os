/**
 * Cliente Supabase para uso em Server Components, Server Actions e
 * Route Handlers (código que roda apenas no servidor, não no browser).
 *
 * Usa `createServerClient` do `@supabase/ssr`, que lê e escreve cookies
 * via a API `next/headers`. É async porque `cookies()` no Next.js 16
 * retorna uma Promise (parte das Async Request APIs introduzidas na v15+).
 *
 * CRÍTICO — nunca usar `supabase.auth.getSession()` aqui: não revalida
 * o token com o servidor do Supabase. Sempre usar `supabase.auth.getUser()`,
 * que faz uma request ao servidor do Supabase a cada chamada e garante que
 * o token não foi revogado. (Documentação oficial do Supabase, 2026.)
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component tentando escrever cookies — o Middleware
            // já renova a sessão; esse catch é esperado e seguro.
          }
        },
      },
    },
  );
}
