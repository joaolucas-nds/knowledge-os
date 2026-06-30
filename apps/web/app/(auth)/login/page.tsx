/**
 * Página de login (/login).
 *
 * Server Component puro — sem "use client". O formulário usa Server Actions
 * (importadas de ./actions.ts) e o estado de erro chega via query param
 * (?error=...) para evitar hidratação desnecessária.
 *
 * Design intencional single-user: sem link de "criar conta" (o único
 * usuário foi criado manualmente no painel do Supabase — ver SETUP.md).
 *
 * `searchParams` é async no Next.js 16 (parte das Async Request APIs).
 */

import { signIn } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-8 bg-neutral-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold text-neutral-100">
            Knowledge OS
          </h1>
          <p className="text-sm text-neutral-400">
            Acesse com as suas credenciais.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signIn} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="text-xs font-medium text-neutral-400 uppercase tracking-wide"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-medium text-neutral-400 uppercase tracking-wide"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-neutral-950"
          >
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
