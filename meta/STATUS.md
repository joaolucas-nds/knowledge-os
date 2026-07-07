# STATUS.md — Estado Atual

> Arquivo **rolante**: descreve só o AGORA. O assistente lê no início para saber onde retomar.
> Item resolvido SAI daqui — vai para o CHANGELOG (se foi entrega) e/ou para o log da sessão.
> Médio e longo prazo NÃO ficam aqui — ficam no ROADMAP.

---

## Versão Atual
**[0.3.2]** — 2026-07-03 — Kit de Contexto atualizado (CEREBRO.md + Instruções do Projeto). CI ainda falhando — usuário aplicou parte da correção da sessão anterior (arquivos), mas pulou os comandos de terminal (deletar `packages\crdt`, `pnpm install`, commit do lockfile).

## ✅ Funcionando (validado de fato)
- **`packages/db/package.json` e `packages/db/src/migrate.ts`** — o usuário já aplicou corretamente os dois arquivos entregues na sessão anterior (confirmado via mount do Projeto: `tsx` presente nas devDependencies, `db:migrate` chamando o script novo).
- **CEREBRO.md e Instruções do Projeto** — atualizados com a última versão do Kit (nova seção de recomendação de config; ASU reformulado por categoria de arquivo). Ver DEC-017.
- Todo o resto (auth, schema, health checks, typecheck/lint) segue validado das sessões anteriores — sem regressão.

## 🔧 Em Progresso
- **CI ainda falhando** — motivo mudou desde a última vez: agora é `[ERR_PNPM_OUTDATED_LOCKFILE]` só sobre `packages/db/package.json` (1 dependência — `tsx` — foi adicionada ao arquivo mas o `pnpm-lock.yaml` commitado não reflete isso). `Scope: all 6 workspace projects` no log confirma que `packages/crdt` **também continua** no repositório — o `rmdir` da sessão anterior não foi executado. Reproduzido e corrigido num sandbox reconstruído: com `packages/crdt` deletado e `pnpm install` rodado, `pnpm install --frozen-lockfile` (o passo exato do CI) passa limpo.
- **Testar `db:migrate` contra o Supabase real** — ainda pendente, só possível depois do CI/lockfile resolvido localmente.
- **Login real no browser contra Supabase** — ainda não testado.

## ❌ Quebrado / Com Problema
- CI (GitHub Actions) — `pnpm install --frozen-lockfile` falha por lockfile desatualizado. Causa raiz identificada e solução já validada em sandbox; falta o usuário rodar os comandos de terminal no ambiente real (ver Backlog).

## 📋 Backlog (curto prazo — itens acionáveis)
- [ ] Você: rodar `rmdir /s /q packages\crdt` (ainda não foi executado — os arquivos crdt continuam no disco).
- [ ] Você: rodar `pnpm install` (sem `--frozen-lockfile`) para regenerar o lockfile com `tsx` e sem `crdt`.
- [ ] Você: `git add .` + commit + push (bloco de comandos entregue nesta sessão).
- [ ] Você: conferir se o job do GitHub Actions passa depois do push.
- [ ] Você: rodar `pnpm --filter @knowledge-os/db db:migrate` — com o script novo já em vigor, deve mostrar o erro real se ainda houver algum (provavelmente `.env` do Supabase incompleto).
- [ ] Aplicar as novas Instruções do Projeto e o CEREBRO.md atualizado (arquivos desta sessão) nas configurações do Projeto no claude.ai.

## 📁 Arquivos Críticos (não mexer sem contexto)
- `packages/crdt/` — **ainda existe no disco do usuário**; precisa ser deletado via `rmdir` (comando, não só ausência num zip — ver DEC-016). Enquanto existir, `pnpm-workspace.yaml` (glob `packages/*`) continua reconhecendo-o.
- `packages/db/package.json` e `packages/db/src/migrate.ts` — já corretos no disco do usuário; não precisam de nova entrega, só o `pnpm install` para sincronizar o lockfile.
- `CEREBRO.md` — atualizado nesta sessão (DEC-017); reflete a versão mais recente do Kit.
- `SETUP.md` — sem mudanças nesta sessão; ainda é a v3 (2026-06-29).

## 💬 Última Sessão
**2026-07-03** — Duas frentes. (1) Usuário reportou nova falha de CI (screenshot + logs `.txt` baixados do GitHub Actions) e confirmou, via consulta ao mount do Projeto, que `packages/db/package.json`/`migrate.ts` da sessão anterior foram aplicados corretamente, mas `packages/crdt` continua no disco (o `rmdir` foi pulado) e o lockfile nunca foi regenerado após adicionar `tsx` — CI falha agora só por essa lacuna. Reproduzido e corrigido em sandbox; instruções de terminal reforçadas. (2) Usuário trouxe atualização do Kit de Contexto (`*__template-update.md` + `instrucoes-dev__template-update.txt`). Comparação completa: 8 dos 9 templates de documento já batem com a estrutura em uso; `CEREBRO.md` ganhou duas seções novas (recomendação de config no fim da sessão; ASU reformulado por categoria de arquivo, substituindo o limiar de tamanho ad hoc deste projeto). CEREBRO.md e Instruções do Projeto entregues atualizados — ver DEC-017.
