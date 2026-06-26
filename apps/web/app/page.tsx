/**
 * Página inicial da F0.
 *
 * Propositalmente simples: o objetivo desta fase não é UI, é provar que
 * apps/web e apps/api sobem juntos em dev e conseguem se comunicar.
 * Server Component fazendo fetch direto no Fastify — sem "use cache",
 * então roda a cada request (queremos status ao vivo, não em cache).
 *
 * Quando wa-sqlite/OPFS entrar (próximo passo desta F0), o "primeiro
 * Block criado e persistido localmente" vai substituir este card por
 * um formulário real de criação de nota.
 */

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
  const health = await fetchApiHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-xl space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Knowledge OS</h1>
        <p className="text-sm text-neutral-400">
          Fase 0 — Fundação Técnica. Esta página só valida que{" "}
          <code className="rounded bg-neutral-800 px-1.5 py-0.5">apps/web</code>{" "}
          e{" "}
          <code className="rounded bg-neutral-800 px-1.5 py-0.5">apps/api</code>{" "}
          conversam em dev.
        </p>
      </div>

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
            <p className="font-medium text-amber-300">
              ⚠ apps/api não respondeu
            </p>
            <p className="mt-1 text-xs text-neutral-400">{health.error}</p>
            <p className="mt-2 text-xs text-neutral-500">
              Rode{" "}
              <code className="rounded bg-neutral-800 px-1 py-0.5">
                pnpm --filter @knowledge-os/api dev
              </code>{" "}
              em outro terminal (ou{" "}
              <code className="rounded bg-neutral-800 px-1 py-0.5">
                pnpm dev
              </code>{" "}
              na raiz para subir tudo via turbo).
            </p>
          </>
        )}
      </div>
    </main>
  );
}
