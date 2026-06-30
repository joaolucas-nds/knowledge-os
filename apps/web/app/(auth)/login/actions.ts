"use server";

/**
 * Server Actions de autenticação.
 *
 * Por que Server Actions em vez de uma Route Handler separada: ações de
 * formulário são mais simples com Server Actions no App Router (nenhuma
 * API endpoint a mais para manter). O redirect() do Next.js garante que
 * o cookie de sessão do Supabase é enviado na resposta antes do cliente
 * seguir para a nova página.
 *
 * Fluxo: formulário → signIn() → Supabase Auth → cookie de sessão → redirect("/")
 * Em caso de erro: redirect("/login?error=...") para mostrar a mensagem
 * sem precisar de estado client-side (a página /login é Server Component).
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=Preencha e-mail e senha.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Não expõe detalhes técnicos do erro ao usuário — só uma mensagem
    // genérica de credenciais inválidas (evita enumeração de usuários).
    redirect("/login?error=E-mail ou senha inválidos.");
  }

  // Sucesso: redireciona para a raiz; o Middleware vai confirmar a sessão
  // nos requests seguintes.
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
