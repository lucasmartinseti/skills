# Fase 4 e 5: Worker, área administrativa mínima, deploy e validação

Templates: `templates/src/{worker,auth,gestao}.js`, `templates/wrangler.jsonc`, `templates/package.json`,
`templates/.gitlab-ci.yml`, `templates/gitignore`. São genéricos; só mude `name`, `SITE_HOST`, o id do KV e textos.

## Worker (`src/worker.js`)

Ordem das decisões por requisição:

1. Domínio final: `http://` ou `www.` -> 301 para `https://<apex>` (no workers.dev não redireciona nada).
2. `/?s=termo` -> 302 `/busca/?s=termo`.
3. `/wp-admin`, `/wp-admin/*`, `/wp-login.php` -> área administrativa (`/_gestao` antigo redireciona).
4. GET/HEAD de página HTML: se existe `page:/caminho/` no KV (`cacheTtl: 60`), serve essa versão (edição do cliente).
5. `env.ASSETS.fetch`. Se 404 e o caminho tem maiúsculas, tenta a versão minúscula e redireciona 301 (URLs
   antigas do WP eram case-insensitive).

`pageKey()` normaliza (`/x` -> `/x/`, `index.html` fora, extensões e áreas reservadas -> null). Config:
`assets.run_worker_first: true` (senão o Worker nem roda para páginas), `html_handling: auto-trailing-slash`,
`not_found_handling: 404-page`, `compatibility_flags: ["nodejs_compat"]` (md5 do phpass via `node:crypto`).

## Área administrativa (`src/gestao.js` + rotas em `worker.js`)

- Mesmos caminhos do WordPress para o cliente não estranhar: login em `/wp-login.php` (form `log`/`pwd`),
  painel em `/wp-admin/`. Cookie de sessão HMAC (`SESSION_SECRET`), 8 h, `Path=/wp-admin`, HttpOnly, Secure,
  SameSite=Lax. POST só da própria origem (`Origin` ou `Sec-Fetch-Site`).
- **Usuários = os do WordPress**: exporte `P_users` (login, e-mail, nome, `user_pass`) para
  `usuarios.local.json` no formato do `wrangler kv bulk put` (`[{key:"user:<login>", value:"{...}"}]`), fora do
  git. `auth.js` valida `pbkdf2:` (próprio), `$wp$2y$` (WP 6.8+: bcrypt sobre `base64(sha384(trim(senha)))`,
  `bcryptjs`), `$2y$/$2a$` (bcrypt puro) e `$P$` (phpass: 2^n rounds de md5). No login correto com hash antigo,
  regrava em PBKDF2 (`hashMigradoEm`). bcrypt custo 10 levou ~2,7 s na primeira validação em produção e passou
  no limite de CPU do Worker; depois do rehash o login fica em ms.
- **Bloqueio por IP**: `fail:<ip>` conta erros seguidos (TTL 1 h); no 3º, `block:<ip>` por 24 h e a tela
  "Acesso bloqueado". Login correto zera. Aba "Bloqueios de IP" lista e desbloqueia. Constantes `MAX_FAILS`,
  `FAIL_WINDOW`, `BLOCK_TTL`.
- **Editor de páginas**: lista de `pages.json` com filtro e marca "editada"; três modos: Visual (iframe
  `sandbox="allow-same-origin"` com `designMode`, sem scripts, `<base href>` e
  `.elementor-invisible{visibility:visible}`), HTML do conteúdo (só o `<main>`), Documento completo. Salvar =
  `POST api/pagina` com o HTML inteiro (valida `<html>`, `</html>`, `<main>`, < 2 MiB) -> `page:/caminho/`
  (e `prev:` para desfazer). Restaurar original apaga a chave. Exportar edições = JSON de todas as páginas
  editadas para o desenvolvedor incorporar em `raw/html`.
- **Usuários**: listar (mostra formato do hash e último login), criar (login `^[A-Za-z0-9@._-]{3,40}$`, senha
  >= 10), trocar senha, ativar/desativar, remover (nunca o próprio).
- Sem SESSION_SECRET o Worker responde 503 explicando o que falta (melhor que erro genérico).

## O que o usuário precisa rodar (o classificador bloqueia para o Claude)

```bash
npx wrangler secret put SESSION_SECRET                                   # valor em .session-secret.local.txt
npx wrangler kv bulk put usuarios.local.json --binding CONTENT --remote  # usuários importados
node scripts/redefinir-senha.mjs <login>                                 # senha nova para testar (mostra só no terminal)
```

Gere os arquivos locais (`.session-secret.local.txt`, `usuarios.local.json`, `gestao-credenciais.local.txt`)
com permissão 600 e confirme com `git check-ignore` que estão fora do git. Peça os comandos ao usuário na
mensagem final, com caminho exato. O que **pode** ser feito pelo Claude: `wrangler kv namespace create`,
`wrangler deploy`, `kv key get --text`, `kv key list`, `kv key delete` de contadores.

## Deploy e validação (fase 5)

```bash
npm install                      # cria package-lock (o CI usa npm ci)
npm run build && npm run check && CI=1 npx wrangler deploy      # workers_dev: true, sem routes ainda
```

Smoke test por `curl` (home, produto, paginação, categoria, busca, `/?s=`, 404 = 404, URL com maiúsculas = 301,
feed = 301, PDF, imagem reduzida, `site.css`, `sitemap.xml`, `search-index.json`, `pages.json`, `/wp-login.php` =
200, headers de segurança) e contagem de resíduos na home (`wpcf7-form`, `mc4wp`, `wp-json` = 0; `wpw-cta`,
GTM, loader do RD = presentes). Depois a revisão visual no Chrome (ver `03-build-estatico.md`, item 5).

Teste de login: no máximo **uma** tentativa com senha errada (conta no IP, que é o mesmo do usuário quando ele
está na mesma rede/máquina) e apague `fail:<ip>` em seguida; nunca três. Com senha correta não há problema.
