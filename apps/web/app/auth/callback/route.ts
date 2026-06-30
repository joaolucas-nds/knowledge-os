/**
 * Route Handler de callback de autenticação (/auth/callback).
 *
 * O Supabase redireciona o usuário para esta URL após fluxos que envolvem
 * redirecionamento externo, como:
 * - Confirmação de e-mail (link enviado após criação de usuário)
 * - "Magic link" (se habilitado)
 * - OAuth providers (Google, GitHub, etc. — se habilitados)
 *
 * Para o projeto atual (single-user, login por email/senha), este handler
 * não é acionado no fluxo normal de uso. Está aqui para:
 * 1. Não quebrar se o Supabase redirecionar por algum motivo inesperado.
 * 2. Suportar facilmente Magic Links ou OAuth no futuro sem refactoring.
 *
 * Troca o `code` recebido na query string por uma sessão real (cookies),
 * e então redireciona o usuário para a home.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // `next` permite redirecionar para uma URL específica após o login
  // (ex.: a página que o usuário tentou acessar antes de ser mandado pro /login)
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redireciona para `next` relativo à origem, usando a URL completa
      // para garantir que funciona tanto em desenvolvimento (localhost:3000)
      // quanto em produção (domínio da Vercel).
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code ausente ou troca falhou → volta para o login com mensagem de erro
  return NextResponse.redirect(`${origin}/login?error=Link+de+confirma%C3%A7%C3%A3o+inv%C3%A1lido+ou+expirado.`);
}
