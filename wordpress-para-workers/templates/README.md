# Templates (origem: migração real de um site WordPress para Workers, 2026-10-12)

Copie para o novo projeto e adapte. Os dados do cliente original foram trocados por valores de exemplo:
`exemplo` / `exemplo.com.br`, `Nome do Cliente`, `contato@exemplo.com.br`, `dominio-antigo*.com.br`,
`<ACCOUNT_ID>`, `<KV_NAMESPACE_ID>`, `<usuario>@<servidor>`, `nome_do_banco` e `prefixo_`.

| Arquivo | Para onde vai | O que adaptar |
|---|---|---|
| `scripts/mirror.sh` | `scripts/` | `HOST`, nomes dos sitemaps (Yoast: post/page/category/post_tag) |
| `scripts/build.mjs` | `scripts/` | tudo na seção específica do site: `SITE`, `SITE_NAME`, `CONTATO`, ids dos formulários, `data-id` das seções removidas, seletores de busca, consertos de caminhos, redirects antigos |
| `scripts/collect-assets.mjs` | `scripts/` | nome da pasta de backup padrão; host nas regex (`exemplo\.com\.br`) |
| `scripts/check.mjs` | `scripts/` | host nas regex; padrões de formulário se o site usar outro plugin |
| `scripts/senha.mjs`, `scripts/redefinir-senha.mjs` | `scripts/` | nada |
| `src/worker.js`, `src/auth.js`, `src/gestao.js` | `src/` | textos (nome do cliente), `MAX_FAILS`/`BLOCK_TTL` se o cliente quiser outro |
| `site.css`, `site.js`, `site-search.js` | `public/assets/` | cores dos botões (`wpw-*`), tipos no índice de busca |
| `wrangler.jsonc` | raiz | `name`, `account_id`, id do KV (`wrangler kv namespace create CONTENT`), `SITE_HOST`, rotas comentadas |
| `package.json`, `.gitlab-ci.yml`, `gitignore` (-> `.gitignore`) | raiz | nome/descrição |
| `redirects-wrangler.jsonc`, `redirects-worker.js` | `redirects/` (Worker separado, os dois arquivos juntos; `npx wrangler deploy -c redirects/redirects-wrangler.jsonc`) | domínios antigos e destino |
| `render-local/router.php`, `render-local/prep-db.php` | scratchpad da renderização local | prefixo das tabelas, lista de plugins a desativar, extrações extras |
| `acesso/ssh-master.exp` | scratchpad | usuário@host |
| `acesso/cf-inspect.mjs` | scratchpad | zonas de interesse (lê o token OAuth do wrangler sem imprimir; só leituras) |
| `backup-README.md` | pasta do backup | tudo (é o README de um backup real, anonimizado, serve de modelo) |
