/**
 * Proxy do Next.js — roda antes de cada request.
 *
 * NOTA DE NOMENCLATURA: este arquivo se chama `proxy.ts` (não
 * `middleware.ts`) porque o Next.js 16 renomeou a convenção — o nome
 * antigo "middleware" confundia com middleware estilo Express. O
 * comportamento é idêntico ao que se chamava "Middleware" até o Next 15;
 * só o nome do arquivo e da função exportada mudou (`proxy` em vez de
 * `middleware`). `middleware.ts` ainda funciona no Next 16 mas está
 * depreciado e será removido numa versão futura — por isso já nasce
 * como `proxy.ts` aqui, sem usar o nome antigo.
 *
 * Responsabilidades:
 * 1. Renovar o token de acesso do Supabase (via refresh token em cookie)
 *    antes que expire — sem isso, o usuário seria deslogado no meio da
 *    sessão sem ter feito nada.
 * 2. Redirecionar para /login se o request for para uma rota protegida
 *    e o usuário não estiver autenticado.
 * 3. Redirecionar para / se o usuário já autenticado tentar acessar /login
 *    (evita ficar preso na tela de login).
 *
 * Implementação baseada no padrão oficial do @supabase/ssr para Next.js
 * (Supabase Docs, 2026). O client aqui usa createServerClient com a API
 * de cookies do NextRequest/NextResponse — diferente do client em
 * lib/supabase/server.ts que usa next/headers.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rotas que qualquer um pode acessar sem estar logado. */
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Propaga os cookies de renovação de sessão tanto no request
          // (para Server Components lendo neste ciclo) quanto na response
          // (para o browser guardar o token renovado) — importante: pular
          // esse passo é a causa raiz do bug conhecido como "logout loop"
          // (cookie de sessão nunca é de fato limpo/atualizado no browser).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // CRÍTICO: sempre usar getUser(), nunca getSession() no servidor.
  // getUser() valida o token com o servidor do Supabase a cada request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublicRoute) {
    // Não autenticado tentando acessar rota protegida → /login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    // Já autenticado tentando acessar /login → home
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /**
     * Roda em todos os paths EXCETO:
     * - _next/static (arquivos estáticos do Next.js)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     * - Arquivos de imagem (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
