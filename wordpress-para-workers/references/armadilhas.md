# Armadilhas encontradas nas migrações (e como evitar)

## Ambiente da máquina (Claude Code no Mac, Bash tool em zsh)

- `"$H:exemplo..."`: zsh interpreta `:e` como modificador (extensão) e o caminho vira `comxemplo...`.
  Sempre `"${H}:caminho"`.
- Variável com vários argumentos (`M="mysql -S sock -u root"; $M -e ...`) não faz word-split em zsh:
  use função `M() { mysql ...; }` ou array `${=M}`.
- `ls` é um alias em formato longo com tamanhos "3 KiB": nunca extraia tamanho/nome com `awk` do `ls`;
  use `stat -f %z`, `find`, `du -sk`.
- Caminho de socket Unix > ~103 chars falha: MySQL (`--socket`) e ssh (`ControlPath`) precisam de caminho curto.
- Scratchpad tem caminho longo: para sockets use `~/.ssh/cm-<x>` ou `/private/tmp/claude-501/<x>.sock`.
- Processos em background (php -S, mysqld) via `run_in_background`; o `exec` dentro do comando mantém a tarefa
  viva enquanto o servidor roda. Encerre no fim.
- Docker Desktop geralmente não está rodando (`docker info` falha): PHP + mysqld do Homebrew resolvem.

## Classificador de segurança (auto mode)

Bloqueia: ler arquivos com credenciais (`cat` do token do wrangler, `xxd` do wp-config), gravar segredos
(`wrangler secret put`), gravar credenciais no KV (`kv bulk put`, `key put` de usuários), editar arquivos no
servidor remoto (`sed -i`, `cp` no shell ssh). Não contorne: prepare arquivos/comandos e peça ao usuário.
Permitido: scripts que leem token/senha para dentro de uma variável sem imprimir (API do Cloudflare com o
OAuth do wrangler para leituras; `MYSQL_PWD` extraído por `sed`), `kv key get/list/delete`, deploy.

## Cloudflare

- OAuth do `wrangler login` tem só `zone:read`: sem DNS nem Rulesets. Para mudar DNS, o usuário faz no painel.
- Custom domains de Worker não sobrescrevem A/CNAME existentes (100117), mesmo em modo não interativo.
- Chrome do usuário pode estar logado em outra conta Cloudflare (sem acesso à zona): o seletor "Escolher conta"
  mostra; não dá para resolver sem o usuário trocar de conta.
- Workers Static Assets: 25 MiB por arquivo, case-sensitive, `_redirects`/`_headers` na raiz de `public/`.
- `wrangler kv key get` sem `--text` não imprime o valor; `kv key put --path arquivo` para JSON.
- KV é eventualmente consistente (até ~60 s) e o Worker usa `cacheTtl: 60`: avise que edições podem demorar
  1 minuto.
- Cache alto em `/assets/*` faz o navegador manter CSS antigo depois do deploy; 10 minutos é suficiente.
- Primeira validação de bcrypt (custo 10) no Worker leva ~2,7 s mas passa; depois do rehash é rápido.

## DreamHost / WordPress

- `ssh` com muitas chaves locais -> "Too many authentication failures": `-o PubkeyAuthentication=no`.
- Host do MySQL é um registro DNS da zona (`mysql.<dominio>`): some junto com a "limpeza" da zona no Cloudflare.
  Host real: `<nome>.pdx1-mysql-<x>.dreamhost.com`, visível no painel/phpMyAdmin.
- `php -r 'include "wp-config.php"; echo DB_PASSWORD;'` aborta quando o banco não responde (o include carrega o
  WP inteiro): leia a senha com `sed`.
- WP Cerber: tabelas `cerber_*` sem prefixo, coluna `user_login`; esconde `wp-login.php` (404 para bots).
- WP Fastest Cache serve páginas em cache mesmo sem banco: o site "parece" no ar enquanto tudo dinâmico dá 500.
  Para saber quando o banco caiu, filtre no access log os 500 com o tamanho da página de erro do WP (~2,6 KB).
- Elementor: CSS por página (`uploads/elementor/css/post-*.css`) pode faltar no servidor; regenera na cópia
  local (pasta gravável). Animações usam `elementor-invisible` + JS; sem JS (preview do editor) injete
  `.elementor-invisible{visibility:visible!important}`.
- Download After Email: `dae_settings.file_id` -> `_wp_attached_file`; arquivos em `uploads/dae-uploads/`.
- Site Kit duplica o GTM quando outro plugin também injeta: deixar um.
- Páginas com caminhos em maiúsculas no cache (`/Produtos/PP/`) existiam porque o MySQL compara sem caixa:
  o Worker redireciona para minúsculas.
- Uploads: imagens originais podem passar de 25 MiB (PNG 6000 px); reduza com `sips -Z 2048`.
- Formulários costumam ser 3 ou 4 (contato no rodapé de todas as páginas, orçamento em produtos, currículo com
  upload, newsletter); currículos ficam em `uploads/cfdb7_uploads` (dados pessoais: só no backup).
- Botão flutuante de WhatsApp sem `wa.me` no HTML = widget do RD Station (loader em cloudfront).
- Hashes: WP 6.8+ `$wp$2y$10$...` (bcrypt de `base64(sha384(trim(senha)))`); usuários sem login recente seguem
  em phpass `$P$B...`.

## Processo

- Perguntar as decisões (formulários, downloads, admin, domínio) numa mensagem só e seguir com padrões se o
  usuário já respondeu no pedido.
- Mostrar números antes de desligar algo (envios por mês, último login) para a decisão ser do usuário.
- Quando o usuário diz "feito", verificar o estado real antes de prosseguir (segredo, usuários, DNS, deploy).
- Testar senha errada no admin conta no IP do usuário: uma vez no máximo, e apagar `fail:<ip>` depois.
- Nunca imprimir senhas/hashes no chat; senha gerada para o usuário vai para arquivo local 600 ou é impressa
  só no terminal dele por script.
