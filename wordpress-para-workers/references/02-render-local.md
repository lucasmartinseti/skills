# Fase 2: WordPress descartável local (renderiza o HTML definitivo a partir do backup)

Por que não capturar da produção: ela pode estar quebrada, tem cache/firewall (7G, ModSecurity, Cerber) no
caminho, e cada captura é diferente. A cópia local é reproduzível, sem risco e gera os CSS por página do
Elementor que o servidor muitas vezes nem tem.

Ferramentas locais usadas: PHP 8.x do Homebrew (`php -m` precisa de mysqli, gd, mbstring, curl, zip, intl),
`mysqld` do Homebrew (MySQL 9 importa dump do 8 sem problema) ou Docker (`docker info` para saber se está
rodando; no Mac costuma não estar).

## 1. Cópia de trabalho dos arquivos (gravável)

```bash
rsync -a --exclude='/wp-content/ai1wm-backups' --exclude='/wp-content/duplicator-backups' \
  --exclude='/wp-content/updraft' --exclude='/wp-content/cache' --exclude='/wp-content/uploads/cfdb7_uploads' \
  --exclude='/wp-content/uploads/wpcf7_uploads' "$B/files/" "$S/wp/html/" && chmod -R a+rwX "$S/wp/html"
```

(exclui backups de plugins e anexos de formulários: currículos e afins não devem sair do backup.)

## 2. MySQL local descartável

```bash
mysqld --no-defaults --initialize-insecure --datadir="$S/wp/mysql-data"
mysqld --no-defaults --datadir="$S/wp/mysql-data" --port=3307 --bind-address=127.0.0.1 \
  --socket=/private/tmp/claude-501/x.sock --mysqlx=OFF --skip-log-bin --sql-mode=NO_ENGINE_SUBSTITUTION   # em background
mysql -h 127.0.0.1 -P 3307 -u root -e "CREATE DATABASE <banco> CHARACTER SET utf8mb4"
gzip -dc "$B/db/<dump>.sql.gz" | mysql -h 127.0.0.1 -P 3307 -u root --default-character-set=utf8mb4 <banco>
```

Socket com caminho curto (limite ~103 chars). Clientes usam TCP (`-h 127.0.0.1 -P 3307`). Encerre no fim com
`mysqladmin ... shutdown`.

## 3. wp-config.php da cópia (só na cópia!)

`sed` troca `DB_HOST` -> `127.0.0.1:3307`, `DB_USER` -> `root`, `DB_PASSWORD` -> `''`, e insere no topo:

```php
$_SERVER["HTTPS"] = "on"; $_SERVER["SERVER_PORT"] = 443;          // WP gera URLs https do domínio final
define("DISABLE_WP_CRON", true); define("AUTOMATIC_UPDATER_DISABLED", true);
define("WP_HOME", "https://<dominio>"); define("WP_SITEURL", "https://<dominio>");
```

## 4. Plugins a desativar só na cópia (`templates/render-local/prep-db.php`)

Segurança (wp-cerber, ithemes), cache (wp-fastest-cache, w3tc, litespeed), backups (updraftplus, duplicator,
all-in-one-wp-migration), pixel/CAPI server-side (official-facebook-pixel), analytics local (koko),
SMTP (wp-mail-smtp), otimizadores que chamam API (image-optimization), editores (classic-editor) e qualquer
coisa que envie dados para fora ao renderizar. **Mantenha** os que geram HTML que você precisa ver para
transformar: Contact Form 7, Mailchimp for WP, Download After Email, Elementor/Pro, tema, Yoast, Site Kit
(só imprime snippets), RD Station, cookie banner, breadcrumbs, sliders.

O script também extrai o que o build precisa: id do pixel, mapa de downloads mediante e-mail (id -> arquivo
em `_wp_attached_file`), e grava `dae-map.json`.

## 5. Servidor PHP embutido

```bash
php -S 127.0.0.1:8081 -t "$S/wp/html" -d display_errors=0 -d log_errors=1 -d error_log="$S/wp/log/php-error.log" \
    -d memory_limit=512M "$S/wp/router.php"      # em background; router em templates/render-local/router.php
curl -s -H "Host: <dominio>" http://127.0.0.1:8081/sitemap_index.xml   # tem que dar 200
```

O router serve arquivos existentes e manda o resto para `index.php` (equivale ao `.htaccess` padrão). Teste
home, `sitemap_index.xml`, uma página inexistente (404) e `/?s=termo` antes de capturar. Olhe o
`php-error.log`: PHP mais novo que o do servidor costuma só gerar deprecations.

## 6. Captura (`templates/scripts/mirror.sh`)

1. Sitemaps (post, page, category, post_tag; ignore author/elementor/rs_elements) -> `raw/sitemaps/` e lista de
   URLs sem imagens/PDF.
2. Cada URL -> `raw/html/<caminho>/index.html` com `curl -H "Host: <dominio>"`.
3. Paginação de blog/categorias/tags (`/page/2/`... até 404).
4. `404.html` (URL inexistente) e `busca-raw.html` (`/?s=termo`) como modelos.

Compare a contagem com o inventário do banco (páginas + posts publicados) e com o cache do servidor
(`wp-content/cache/all/**`), que costuma ter versões com maiúsculas (`/Produtos/PP/`): essas URLs antigas
viram redirect 301 no Worker.
