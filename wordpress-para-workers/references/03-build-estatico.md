# Fase 3: build estático (`raw/` -> `public/`), coleta de assets e check

Comece copiando `templates/scripts/{build,collect-assets,check}.mjs` e `templates/{site.css,site.js,site-search.js}`
para `public/assets/`. O `build.mjs` do template é o de uma migração real (anonimizado): adapte os seletores da seção "específico do
site" depois de inspecionar o HTML capturado. O resto é genérico.

## 1. Inspecionar antes de escrever regras (uma passada de node/grep em `raw/html`)

- `<head>`: links `pingback/EditURI/wlwmanifest/shortlink/api.w.org/alternate (rss, oembed, json)/dns-prefetch
  do próprio host`, `meta generator`, snippets de GTM/GA/pixel e seus marcadores (`<!-- ... Site Kit -->`).
- Scripts: hosts externos (manter GTM, RD Station, fontes; remover reCAPTCHA do CF7), scripts locais (listar
  caminhos únicos sem `?ver`), scripts inline por `id` (`contact-form-7-js-before`, `dae-download-js-extra`,
  `googlesitekit-events-provider-*`, `wp-emoji-settings`, `mc4wp`, `speculationrules`).
- Referências a `admin-ajax.php`, `wp-json`, `xmlrpc`, `wp-login` (onde e em que atributo).
- Formulários: cada `<div class="wpcf7 ..." id="wpcf7-f<ID>-...">`, forms do Mailchimp, Elementor Forms; a
  seção/widget que os envolve (para saber se remove o bloco inteiro ou só troca o form).
- Downloads mediante e-mail: bloco `dae-shortcode-download-wrapper` com `<input name="file" value="X.pdf">`.
- Busca: `<form ... action="https://site/" ...><input name="s">`.
- Rodapé: texto com ano/copyright; e-mails e telefones (`grep -ohE '[a-z0-9._-]+@dominio'`, `wa.me/...`).
- Botão flutuante de WhatsApp: se não houver `wa.me` no HTML, costuma ser widget do RD Station
  (`rdstation-popup-js-floating-button`): continua funcionando no estático mantendo o loader
  `d335luupugsy2.cloudfront.net/js/loader-scripts/<id>-loader.js`.
- Páginas que referenciam caminhos quebrados já no WP (`/homologacao/...` de homologação, arquivos apagados).

## 2. Transformações (ordem importa)

1. Proteger JSON-LD (placeholder) para manter URLs absolutas no schema.
2. Remover seções inteiras que saem (newsletter), por `data-id` da seção Elementor, usando um cortador de
   elemento balanceado (`elementEnd/replaceElements` do template), nunca regex gulosa.
3. CF7 por id -> bloco de chamada (`ctaContato`, `ctaOrcamento(h1)`, `ctaVagas`): botões WhatsApp
   (`data-rd-whatsapp`, abre o widget do RD se existir, senão `wa.me`) e `mailto:` do comercial.
4. DAE -> `<a class="dae-shortcode-download-button" href="/wp-content/uploads/dae-uploads/<file>" download>`
   reaproveitando as classes do plugin (CSS fica; JS sai). `color:inherit` para não ficar verde sobre verde.
5. Remover scripts/estilos por `src`/`id`/conteúdo (lista `dropSrc`, `dropInlineId`, `dropInlineBody`),
   `speculationrules`, emoji, comment-reply, e a cópia duplicada do GTM (ficar com uma).
6. Metadados do WP (item 1 da inspeção).
7. `"ajaxurl"`/`"ajax_url"` em configs inline -> `""` (o check reprova URL de ajax preenchida).
8. Busca -> `action="/busca/"` (header e sidebar: `search-?form`).
9. Rodapé: ano = ano atual; consertos de caminhos quebrados conhecidos.
10. URLs absolutas -> relativas: `https?://dominio/` -> `/`, forma escapada `https:\/\/dominio\/` -> `\/`
    (JSON do Elementor), protocolo-relativa `//dominio/` -> `/`. Depois restaurar `canonical`, `next/prev`,
    `og:*`/`twitter:*` para absolutas. `/page/1/` -> base.
11. Injetar `/assets/site.css` e `/assets/site.js`.

Saídas extras: `404.html`, `busca/index.html` (modelo da busca com `<div id="search-results">` + `site-search.js`),
`search-index.json` (páginas, produtos e posts: url, título, excerpt, imagem, tipo, texto), `pages.json`
(manifesto para a área administrativa), `sitemap.xml` (das entradas dos sitemaps do Yoast), `robots.txt`
(Disallow `/busca/`, `/wp-admin/`, `/wp-login.php`), `_redirects` (`/page/1/`, feeds, `xmlrpc.php`, slugs antigos,
home com slug) e `_headers` (segurança + cache: uploads 1 ano, tema/plugins 1 semana, `/assets` 10 min, `pages.json`
`no-store`).

Não mande `/wp-admin/*` nem `/wp-login.php` para `_redirects` se a área administrativa usa esses caminhos.

## 3. Coleta de assets (`collect-assets.mjs`)

- Fontes, em ordem: `RENDER_FILES` (cópia local, onde o Elementor regenerou `uploads/elementor/css/post-*.css`)
  e `BACKUP_FILES`. Primeiro que tiver o arquivo vence.
- Varre `src/href/srcset/data-*/poster/content`, `url()` em CSS (recursivo, resolvendo relativo ao CSS),
  JSON de atributos (`\/wp-content\/...`), e inclui todos os PDFs de `dae-uploads`.
- Ignora padrões com `*` (speculation rules), diretórios e refs `//host`.
- Arquivo > 24 MiB: `sips -Z 2048` para dentro de `public/` (limite do Workers é 25 MiB). Avisa se não conseguir.
- Grava `raw/assets-manifest.txt`.

## 4. Check (`check.mjs`)

Reprova: endpoints do WP (`wp-json`, `xmlrpc`, `wp-login`, `/wp-admin/`) fora de `<style>`, formulários
(`class="wpcf7`, `mc4wp-form`, `dae-shortcode-register`, `g-recaptcha`), URL de ajax preenchida, URL absoluta
do próprio site em `src/href/action`, ano antigo no rodapé, qualquer `<form>` que não seja a busca ou o banner
de cookies, asset local referenciado que não existe em `public/`, e arquivos obrigatórios ausentes.
Exclui da verificação `canonical`, `og:*`, `next/prev` e JSON-LD (podem ser absolutos).

## 5. Revisão visual (obrigatória, no Chrome)

Home (topo e rodapé), uma página de produto/serviço (botão de download, chamada de orçamento), uma página de
blog, `/busca/?s=termo`, 404. Procure: texto da mesma cor do fundo (herança de `a` vs `div`), seções
Elementor invisíveis (`elementor-invisible` sem animar = JS quebrado), slider parado, widget do WhatsApp
presente. Lembre que o navegador pode segurar `site.css` antigo (cache): valide com `curl` o CSS publicado.
