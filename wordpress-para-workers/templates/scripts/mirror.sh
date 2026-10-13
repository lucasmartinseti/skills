#!/usr/bin/env bash
# Captura o HTML renderizado do WordPress para raw/ (executado em 2026-10-12).
#
# Fonte: uma cópia LOCAL e descartável do WordPress (arquivos + dump do banco do backup da DreamHost),
# servida por `php -S 127.0.0.1:8081` com router.php e wp-config apontando para um MySQL local.
# O WordPress acha que está em https://exemplo.com.br (WP_HOME/WP_SITEURL + $_SERVER['HTTPS']),
# por isso o HTML sai com as URLs definitivas; o build converte para relativas.
# Reexecute apenas se recriar essa cópia local (ver README, seção "Como o conteúdo foi capturado").
set -euo pipefail
BASE=${BASE:-http://127.0.0.1:8081}
HOST=${HOST:-exemplo.com.br}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
RAW="$ROOT/raw"
mkdir -p "$RAW/html" "$RAW/sitemaps"
get() { curl -sS -m 120 -H "Host: $HOST" -o "$2" -w "%{http_code}" "$BASE$1"; }

# 1. Sitemaps do Yoast (inventário de URLs). author/rs_elements/elementor-hf não viram páginas públicas.
get /sitemap_index.xml "$RAW/sitemaps/sitemap_index.xml" >/dev/null
for sm in post page category post_tag; do
  code=$(get "/${sm}-sitemap.xml" "$RAW/sitemaps/${sm}-sitemap.xml"); echo "sitemap $sm: $code"
done
cat "$RAW"/sitemaps/{post,page,category,post_tag}-sitemap.xml | grep -oE '<loc>[^<]+</loc>' | sed -E 's#</?loc>##g' \
  | grep -vE '\.(jpe?g|png|gif|svg|webp|pdf)$' | sed -E "s#https://$HOST##" | sort -u > "$RAW/urls.txt"

# 2. Páginas, posts, categorias e tags
n=0; fail=0
while read -r path; do
  [ -z "$path" ] && continue
  out="$RAW/html${path}index.html"; mkdir -p "$(dirname "$out")"
  code=$(get "$path" "$out")
  if [ "$code" != "200" ]; then echo "FALHA $code $path"; fail=$((fail+1)); rm -f "$out"; else n=$((n+1)); fi
done < "$RAW/urls.txt"
echo "páginas capturadas: $n (falhas: $fail)"

# 3. Paginação do blog e dos arquivos (só existe se houver mais posts que o limite por página)
for base in $(grep -E '^/(blog[^/]*|category/[^/]+|tag/[^/]+)/$' "$RAW/urls.txt"); do
  for p in 2 3 4; do
    out="$RAW/html${base}page/$p/index.html"; mkdir -p "$(dirname "$out")"
    code=$(get "${base}page/$p/" "$out")
    if [ "$code" = "200" ]; then echo "paginação: ${base}page/$p/"; else rm -f "$out"; rmdir "$(dirname "$out")" 2>/dev/null || true; break; fi
  done
done

# 4. Página 404 e modelo da busca
get /pagina-que-nao-existe-xyz/ "$RAW/html/404.html" >/dev/null
get "/?s=produto" "$RAW/html/busca-raw.html" >/dev/null
echo "ok: $(find "$RAW/html" -name '*.html' | wc -l | tr -d ' ') arquivos em raw/html"
