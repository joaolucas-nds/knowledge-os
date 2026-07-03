# STATUS.md — Estado Atual

> Arquivo **rolante**: descreve só o AGORA. O assistente lê no início para saber onde retomar.
> Item resolvido SAI daqui — vai para o CHANGELOG (se foi entrega) e/ou para o log da sessão.
> Médio e longo prazo NÃO ficam aqui — ficam no ROADMAP.

---

## Versão Atual
**[0.3.1]** — 2026-06-30 — dois bugs reais encontrados (via CI do usuário + console log) e corrigidos: `packages/crdt` ainda existia no disco (nunca foi de fato deletado) e quebrava o CI; `drizzle-kit migrate` escondia o erro real de conexão/SQL. Ambos reproduzidos neste sandbox antes da correção — não são suposições.

## ✅ Funcionando (validado de fato)
- **CI (GitHub Actions)** — causa raiz do failure confirmada: `packages/crdt/` continuava no disco do usuário (removido só no zip da sessão de 2026-06-26, nunca deletado de fato — ver DEC-016/armadilha #13). Reproduzido neste sandbox (mesma contagem "6 workspace projects", mesmas 2 dependências fantasma). Corrigido: pasta deletada, lockfile regenerado, `pnpm install --frozen-lockfile` (o exato passo do CI) validado localmente com sucesso.
- **`db:migrate`** — causa raiz confirmada: bug conhecido do `drizzle-kit` 0.x (issues #5521/#5601/#5816/#5520 do repositório oficial) que engole o erro real em caso de falha. Reproduzido neste sandbox forçando uma migration com SQL inválido: CLI deu só "Exit status 1", zero mensagem. Corrigido: `db:migrate` agora roda `packages/db/src/migrate.ts` (script próprio via API programática do Drizzle) — testado nos 4 cenários possíveis: SQL inválido (mostra o erro real de SQL), senha errada (mostra "password authentication failed"), `DATABASE_URL` ausente (mensagem própria, sem tentar conectar) e caso feliz (aplica e é idempotente ao rodar de novo).
- Todo o resto (auth, schema, health checks) continua validado das sessões anteriores — sem regressão: `pnpm typecheck`/`pnpm lint` seguem limpos nos 4 workspaces reais (sem `packages/crdt`).

## 🔧 Em Progresso
- **Você ainda precisa rodar os comandos de correção no seu PC** — o que foi validado aqui foi feito numa cópia reconstruída do seu repositório real (a partir do que está no Projeto); as mudanças precisam ser aplicadas no seu `C:\Users\alexk\Tools\Knowledge-OS\knowledge-os` de verdade. Ver bloco de comandos entregue nesta sessão.
- **Testar `db:migrate` contra o Supabase real** — com o bug da CLI corrigido, a próxima tentativa vai finalmente mostrar por que a conexão estava falhando (se ainda estiver). Prováveis causas, pela ordem mais comum: `.env` do `packages/db` vazio/não preenchido, porta errada (6543 em vez de 5432 — ver DEC-014), ou senha com caractere especial não escapado na URL.
- **Login real no browser contra Supabase** — ainda não testado (depende do item acima estar resolvido primeiro).

## ❌ Quebrado / Com Problema
- Nenhum bug aberto no código entregue nesta sessão. Os dois bugs desta sessão (CI + migrate silencioso) foram corrigidos e validados — ver FIX-003/DEC-016 em DECISIONS.md. Falta você aplicar a correção no seu ambiente real e confirmar.

## 📋 Backlog (curto prazo — itens acionáveis)
- [ ] Você: aplicar os comandos de correção desta sessão (deletar `packages\crdt`, `pnpm install`, substituir `packages\db\package.json`, adicionar `packages\db\src\migrate.ts`, instalar `tsx` no `packages/db`).
- [ ] Você: rodar `pnpm --filter @knowledge-os/db db:migrate` de novo — agora deve mostrar o erro real, se ainda houver algum.
- [ ] Você: se o erro mostrado for sobre `DATABASE_URL`/senha/porta, revisar `packages\db\.env` contra o SETUP.md §3.1/§4.
- [ ] Você: fazer commit + push (bloco de comandos entregue) para a CI parar de falhar.
- [ ] Validar login real no browser contra Supabase (pendente desde a sessão anterior).

## 📁 Arquivos Críticos (não mexer sem contexto)
- `packages/db/src/migrate.ts` — **novo**. É quem `db:migrate` chama agora (não mais a CLI do drizzle-kit direto) — ver FIX-003. Não reverter para `drizzle-kit migrate` sem reler o motivo.
- `packages/db/package.json` — script `db:migrate` mudou de `drizzle-kit migrate` para `tsx src/migrate.ts`.
- `pnpm-workspace.yaml` — o glob `packages/*` pega QUALQUER pasta com `package.json` dentro de `packages/` automaticamente; não deixar pastas obsoletas lá (foi exatamente isso que causou o bug do CI).
- `apps/web/proxy.ts`, `apps/api/src/auth/plugin.ts`, `packages/db/src/client.ts` — sem mudanças nesta sessão, continuam como na sessão de 2026-06-29.
- `SETUP.md` — sem mudanças nesta sessão; ainda é a v3 (2026-06-29).

## 💬 Última Sessão
**2026-06-30** — Usuário reportou dois problemas reais (screenshot do GitHub Actions + console log local). Investigação (via os arquivos reais do Projeto, não suposição): confirmado que `packages/crdt` nunca foi de fato deletado do disco do usuário (só omitido de um zip na sessão de 2026-06-26) — pnpm o reconhece via o glob `packages/*` do workspace, e seu `package.json` (que ainda pede `@automerge/automerge`/`typescript`) não bate com o `pnpm-lock.yaml` já "limpo", quebrando `pnpm install --frozen-lockfile` no CI. Reconstruído o repositório real num sandbox (a partir do Projeto) para reproduzir e confirmar antes de corrigir: mesma contagem de "6 workspace projects", exatamente as mesmas 2 dependências fantasma do log do usuário. Corrigido e revalidado (typecheck/lint/frozen-install, tudo limpo). Separadamente, `pnpm --filter @knowledge-os/db db:migrate` falhava local com "Exit status 1" sem mensagem — pesquisa confirmou bug conhecido e não corrigido do `drizzle-kit` 0.x (exatamente as versões deste projeto, citadas nas issues oficiais). Reproduzido no sandbox forçando um SQL inválido: mesmo comportamento (silêncio total). Corrigido com um script próprio (`migrate.ts`) usando a API programática do Drizzle, que expõe o erro real — testado nos 4 cenários (SQL inválido, senha errada, URL ausente, caso feliz + idempotência). Duas novas entradas em DECISIONS.md (FIX-003, DEC-016) e feedback registrado no IDEAS.md sobre a lição de remoção via zip.
