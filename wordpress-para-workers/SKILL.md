---
name: wordpress-para-workers
description: Migra um site WordPress (hospedagem compartilhada como DreamHost, cPanel etc.) para site 100% estático no Cloudflare Workers + Static Assets, com backup verificado, renderização local a partir do backup, build reproduzível, área administrativa mínima (/wp-admin) que mantém os usuários e senhas do WordPress, bloqueio de IP e virada de domínio sem downtime. Use SEMPRE que o usuário falar em migrar, tirar, desligar ou "transformar em estático" um site WordPress, em levar um site para Workers/Cloudflare, em fazer backup de um WordPress antes de cancelar a hospedagem, ou em criar uma "área mínima de gestão" para um site estático. Vale mesmo que ele não diga "WordPress" explicitamente mas mencione DreamHost, Elementor, wp-admin, wp-content, Contact Form 7 ou um site em PHP que quer parar de pagar.
---

# WordPress -> Cloudflare Workers (site estático + área administrativa mínima)

Método usado nas migrações da chagbrasil. O princípio: **o WordPress vira fonte de HTML renderizado**, o site
publicado é só HTML/CSS/JS/arquivos servidos por um Worker, e o que precisava de PHP (formulários, downloads
mediante e-mail, busca, painel) é substituído por algo estático ou por um Worker pequeno. Nada muda no site em
produção até a virada do domínio, e o backup completo é feito antes de qualquer coisa.

Dois casos reais orientam a skill: um site de escritório com tema próprio e formulários via Worker, e um site
de catálogo industrial em OceanWP + Elementor (125 páginas, área `/wp-admin` com usuários do WordPress). Os
templates desta skill vêm do segundo, com os dados do cliente trocados por `exemplo.com.br` e placeholders.

## Quando a skill se aplica e quando não

- Aplica: site institucional/catálogo/blog em WordPress cujo conteúdo muda pouco; cliente quer parar de pagar
  hospedagem ou está com o WP quebrado; aceita perder o painel completo em troca de edição simples.
- Não aplica sem adaptação: loja (WooCommerce), área logada de clientes, conteúdo gerado por usuários,
  formulários que precisam continuar gravando em banco. Nesses casos, avise o usuário e proponha o que fica
  dinâmico (Worker + KV/D1) antes de começar.

## Fluxo em 7 fases

Cada fase tem um arquivo em `references/` com comandos e armadilhas. Leia o da fase antes de executá-la.

| Fase | O que entrega | Referência |
|---|---|---|
| 0. Combinar escopo | decisões do usuário (formulários, downloads, admin, domínio) | esta página, seção "Decisões" |
| 1. Backup e diagnóstico | cópia integral verificada por MD5 + dump do banco + relatório de uso real | `references/01-backup-e-diagnostico.md` |
| 2. Renderização local | WordPress descartável local servindo o HTML definitivo | `references/02-render-local.md` |
| 3. Captura e build | `raw/` (HTML + sitemaps) -> `public/` (site estático) + check | `references/03-build-estatico.md` |
| 4. Worker e área administrativa | Worker com assets, KV, `/wp-admin`, auth com hashes do WP, bloqueio de IP | `references/04-worker-e-admin.md` |
| 5. Publicar e validar | deploy no workers.dev, smoke test, revisão visual | `references/04-worker-e-admin.md` (fim) |
| 6. Virada do domínio | custom domains, redirects dos domínios antigos, pós-virada | `references/05-virada-e-pos.md` |
| 7. Entregar | README, repositório, memória do projeto, limpeza | `references/05-virada-e-pos.md` |

Comece sempre pela fase 1, mesmo que o usuário peça "só a migração": o backup é o que permite renderizar
localmente sem depender da produção, e o diagnóstico (último login, último upload, envios de formulário,
serviços externos) é o que o usuário precisa para decidir o escopo.

## Decisões que precisam do usuário (pergunte cedo, numa mensagem só)

1. **Formulários**: desligar (padrão) e trocar por WhatsApp + e-mail? Manter via Worker `POST /api/form` com
   RD Station/Resend? Mostre o volume real (tabela `*_db7_forms`, Flamingo, etc.) antes de perguntar.
2. **Downloads mediante e-mail** (Download After Email e similares): virar download direto (padrão).
3. **Área administrativa**: nenhuma; mínima própria em `/wp-admin` com os mesmos usuários/senhas do WordPress
   (padrão desta skill); ou editar só pelo repositório.
4. **Domínio**: validar no workers.dev primeiro e virar depois (padrão), e quem apaga os registros DNS.
5. **Onde fica o backup**: fora do repositório (padrão); o dump do banco nunca vai para o git.

Se o usuário já respondeu no pedido, não pergunte de novo; registre as decisões no README do projeto.

## Estrutura do repositório resultante

```
raw/html/<caminho>/index.html   HTML renderizado (fonte do build) + 404.html + busca-raw.html
raw/sitemaps/*.xml              sitemaps do Yoast/RankMath (inventário de URLs)
raw/assets-manifest.txt         arquivos do WordPress copiados para public/
scripts/mirror.sh               como raw/ foi capturado
scripts/build.mjs               raw/ -> public/ (todas as transformações; adaptar por site)
scripts/collect-assets.mjs      copia só os arquivos referenciados (tema, plugins, uploads) do backup
scripts/check.mjs               falha se sobrar dependência do WP, formulário ou asset faltando
scripts/senha.mjs, redefinir-senha.mjs   senha/hash da área administrativa
public/                         site publicado (mesmos caminhos /wp-content/... do WordPress)
src/worker.js, auth.js, gestao.js        Worker + área administrativa
wrangler.jsonc, package.json, .gitlab-ci.yml, README.md
redirects/                      Worker separado para domínios antigos (se houver)
```

Templates prontos em `templates/` desta skill (copie e adapte). `build.mjs` é o único arquivo que muda muito
de site para site; o resto é quase idêntico.

## Princípios que evitam retrabalho

- **Fidelidade primeiro**: manter os mesmos caminhos (`/wp-content/uploads/...`), o mesmo HTML do tema e os
  mesmos scripts externos (GTM, pixel, RD Station). Só remover o que depende de PHP. Converter URLs absolutas
  do site em relativas para o mesmo build servir workers.dev e domínio final.
- **Renderize do backup, não da produção**: a produção pode estar quebrada (num dos casos o banco sumiu no meio
  do processo) e a captura local é reproduzível. Além disso o Elementor só tinha 5 dos 101 CSS por página no
  servidor; a renderização local gerou todos.
- **Assets referenciados, não a pasta inteira**: `collect-assets.mjs` varre HTML e CSS (recursivo, `url()`,
  `srcset`, JSON de atributos do Elementor) e copia só o que é usado. Limite do Workers: 25 MiB por arquivo e
  20 mil arquivos; imagens maiores são reduzidas com `sips`.
- **Check obrigatório antes do deploy**: `npm run deploy` = build + check + wrangler deploy. O check pega
  `wp-json`, `admin-ajax`, formulários, URLs absolutas e assets faltando.
- **Nada de segredo no git**: dump do banco, `usuarios.local.json` (hashes), `.session-secret.local.txt` e
  `gestao-credenciais.local.txt` ficam fora (padrões `*.local.*` no `.gitignore`).
- **O que o classificador de segurança do Claude Code bloqueia, o usuário executa**: gravar segredos
  (`wrangler secret put`), gravar credenciais no KV (`kv bulk put`/`key put` de usuários) e editar arquivos
  no servidor de origem. Prepare o arquivo/comando exato e peça para o usuário rodar; não contorne.

## Armadilhas já pagas (resumo; lista completa em `references/armadilhas.md`)

- Ao "limpar" registros DNS de uma zona para custom domains, **não apagar o registro `mysql.<dominio>`** da
  DreamHost: o WordPress de produção perde o banco (foi o que aconteceu). Host real do MySQL fica no painel.
- Custom domains de Worker não sobrescrevem registros A/CNAME existentes (erro 100117): o usuário apaga
  antes, no painel; o `wrangler deploy` então cria DNS e certificado.
- Bash tool roda zsh: `"$H:exemplo..."` vira modificador `:e`. Use `"${H}:caminho"`. Variáveis com flags
  (`$M -e ...`) não fazem word-split: use função ou array.
- Caminho de socket Unix tem limite de ~103 caracteres: MySQL local e `ControlPath` do ssh precisam de
  caminho curto (`~/.ssh/cm-x`, `/private/tmp/claude-501/x.sock`).
- DreamHost: `ssh` com muitas chaves locais dá "Too many authentication failures"; use
  `-o PubkeyAuthentication=no -o PreferredAuthentications=password` no master via `expect`.
- `php -r 'include "wp-config.php"'` para ler a senha do banco não funciona quando o host não resolve
  (o WP aborta antes do echo): extraia com `sed`.
- WordPress 6.8+ usa bcrypt com prefixo `$wp$2y$` sobre `base64(sha384(senha))`; usuários antigos ainda têm
  phpass `$P$`. `auth.js` valida os dois e regrava em PBKDF2 no primeiro login.
- Testar senha errada na área administrativa conta no IP de quem roda o teste (normalmente o mesmo do usuário):
  no máximo uma tentativa, e apague `fail:<ip>` depois.
- Cache de `/assets/*` alto faz o navegador segurar CSS velho após deploy: `max-age=600`.
- `wrangler kv key get` precisa de `--text` para imprimir o valor.

## Entrega mínima ao final

- README do projeto com: estrutura, fluxo (`npm run build/check/deploy`), o que o build muda, área
  administrativa (como entrar, bloqueio, redefinir senha), virada/estado do domínio, o que ficou de fora.
- README dentro da pasta de backup (template em `templates/backup-README.md`).
- Commits no repositório do cliente (sem segredos) e memória do projeto atualizada com: host MySQL real,
  decisões, pendências que o usuário precisa executar.
- Mensagem final ao usuário com link de validação, os comandos que ele precisa rodar e o checklist pós-virada.
