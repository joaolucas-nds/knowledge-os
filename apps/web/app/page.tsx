/**
 * Página inicial (/). Requer autenticação — o Middleware já redireciona
 * para /login se o usuário não estiver logado; esta página não precisa
 * checar novamente.
 *
 * Por enquanto exibe: saudação com o e-mail do usuário + status da API
 * (mesma validação de F0) + botão de logout. Será substituída pela
 * interface real do workspace na F1 (Core de Notas).
 */

import { createClient } from "@/lib/supabase/server";
import { signOut } from "./(auth)/login/actions";

interface ApiHealth {
  status: "ok";
  uptimeSeconds: number;
  timestamp: string;
}

async function fetchApiHealth(): Promise<
  { ok: true; data: ApiHealth } | { ok: false; error: string }
> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, error: `API respondeu ${response.status}` };
    }
    const data = (await response.json()) as ApiHealth;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: `Não foi possível conectar em ${apiUrl} — apps/api está rodando?`,
    };
  }
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const health = await fetchApiHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {/* Cabeçalho com info do usuário e botão de logout */}
      <div className="w-full max-w-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-100">
            Knowledge OS
          </h1>
          {user?.email && (
            <p className="text-xs text-neutral-500 mt-0.5">{user.email}</p>
          )}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1 rounded border border-transparent hover:border-neutral-700"
          >
            Sair
          </button>
        </form>
      </div>

      {/* Status da API (validação F0 — substituir na F1) */}
      <div
        className={`w-full max-w-xl rounded-lg border p-4 text-left text-sm ${
          health.ok
            ? "border-emerald-800 bg-emerald-950/40"
            : "border-amber-800 bg-amber-950/40"
        }`}
      >
        {health.ok ? (
          <>
            <p className="font-medium text-emerald-300">
              ✓ apps/api respondeu em /health
            </p>
            <pre className="mt-2 overflow-x-auto text-xs text-neutral-400">
              {JSON.stringify(health.data, null, 2)}
            </pre>
          </>
        ) : (
          <>
            <p className="font-medium text-amber-300">⚠ apps/api não respondeu</p>
            <p className="mt-1 text-xs text-neutral-400">{health.error}</p>
          </>
        )}
      </div>

      <p className="text-xs text-neutral-600 max-w-xl text-center">
        F0 concluída — autenticação funcionando. A interface real do workspace
        (editor de notas, canvas, tabelas) vem na F1.
      </p>
    </main>
  );
}
