// Build: transforma o HTML capturado do WordPress (raw/html) no site estático final (public/).
// Uso: node scripts/build.mjs
//
// O que muda em relação ao WordPress (resumo; detalhes em cada etapa abaixo):
//  - formulários (Contact Form 7, Mailchimp, Download After Email) saem; no lugar entram chamadas para
//    WhatsApp (botão do RD Station) e e-mail do comercial, e as fichas técnicas viram download direto;
//  - metadados/scripts que só fazem sentido com o WordPress rodando (wp-json, feeds, emoji, reCAPTCHA...) saem;
//  - busca do site passa a ser feita no navegador (/busca/ + search-index.json);
//  - URLs absolutas do próprio site viram relativas (funciona no workers.dev e no domínio final);
//  - rodapé: ano atualizado.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, unlinkSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RAW = join(ROOT, 'raw', 'html');
const SITEMAPS = join(ROOT, 'raw', 'sitemaps');
const OUT = join(ROOT, 'public');
const SITE = 'https://exemplo.com.br';
const SITE_NAME = 'Nome do Cliente';

// Contatos usados nas chamadas que substituem os formulários.
// O botão de WhatsApp aciona o widget do RD Station quando ele estiver na página (número gerenciado lá);
// o link abaixo é só o fallback. O e-mail é o do comercial, igual ao do rodapé.
export const CONTATO = {
  email: 'contato@exemplo.com.br',
  whatsapp: '5500000000000', // DDI + DDD + número, o mesmo publicado no site
  vagas: 'https://exemplo.vagas.solides.com.br/',
};
const ANO = new Date().getFullYear();

// ---------- utilidades ----------
const walk = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};
const write = (file, content) => { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, content); };
const attr = (html, re) => { const m = html.match(re); return m ? m[1] : ''; };
const decode = (s) => s.replace(/&#0?38;|&amp;/g, '&').replace(/&#0?39;|&#8217;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ').replace(/&#8211;/g, '–').replace(/&#8220;|&#8221;/g, '"');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Fim do elemento (div/section/form/...) cuja tag de abertura começa em `start`: percorre as tags do mesmo nome contando profundidade.
function elementEnd(html, start) {
  const tag = html.slice(start + 1).match(/^[a-zA-Z0-9]+/)[0];
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'g');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return m.index + m[0].length; }
    else if (!m[0].endsWith('/>')) depth++;
  }
  return -1;
}
// Substitui cada elemento cuja tag de abertura casa com `openRe` pelo retorno de fn(elementoCompleto, match).
function replaceElements(html, openRe, fn) {
  const re = new RegExp(openRe.source, 'g');
  let out = '', last = 0, m;
  while ((m = re.exec(html))) {
    if (m.index < last) continue;
    const end = elementEnd(html, m.index);
    if (end < 0) break;
    out += html.slice(last, m.index) + fn(html.slice(m.index, end), m);
    last = end; re.lastIndex = end;
  }
  return out + html.slice(last);
}
// Remove um trecho entre dois comentários HTML (inclusive).
const cutBetween = (html, a, b) => html.replace(new RegExp(`${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g'), '');

// ---------- blocos que substituem os formulários ----------
const btnWhats = (texto = 'Falar no WhatsApp') =>
  `<a class="wpw-btn wpw-btn-whats" href="https://wa.me/${CONTATO.whatsapp}" target="_blank" rel="noopener" data-rd-whatsapp><i class="fab fa-whatsapp" aria-hidden="true"></i> ${texto}</a>`;
const btnMail = (assunto, texto = CONTATO.email) =>
  `<a class="wpw-btn wpw-btn-mail" href="mailto:${CONTATO.email}${assunto ? `?subject=${encodeURIComponent(assunto)}` : ''}"><i class="fas fa-envelope" aria-hidden="true"></i> ${texto}</a>`;

const ctaContato = () => `<div class="wpw-cta wpw-cta-escuro" data-wpw-cta="contato">
<p class="wpw-cta-texto">Fale com a nossa equipe pelo WhatsApp ou envie um e-mail para o comercial. Respondemos em horário comercial.</p>
<div class="wpw-cta-botoes">${btnWhats()}${btnMail('Contato pelo site')}</div>
</div>`;
const ctaOrcamento = (produto) => `<div class="wpw-cta wpw-cta-verde" data-wpw-cta="orcamento">
<p class="wpw-cta-texto">Peça o orçamento${produto ? ` de <strong>${esc(produto)}</strong>` : ''} diretamente com o nosso comercial:</p>
<div class="wpw-cta-botoes">${btnWhats('Orçamento pelo WhatsApp')}${btnMail(`Orçamento${produto ? ` - ${produto}` : ''}`, 'Orçamento por e-mail')}</div>
<p class="wpw-cta-nota">${CONTATO.email}</p>
</div>`;
const ctaVagas = () => `<div class="wpw-cta wpw-cta-claro" data-wpw-cta="vagas">
<p class="wpw-cta-texto">As vagas abertas e o cadastro de currículo ficam no nosso portal de carreiras.</p>
<div class="wpw-cta-botoes"><a class="wpw-btn wpw-btn-whats" href="${CONTATO.vagas}" target="_blank" rel="noopener"><i class="fas fa-briefcase" aria-hidden="true"></i> Cadastrar currículo no portal de vagas</a></div>
</div>`;

// ---------- transformação de uma página ----------
function transform(html, pathname) {
  const pageTitle = decode(attr(html, /<meta property="og:title" content="([^"]*)"/) || attr(html, /<title>([^<]*)<\/title>/));
  const h1 = decode((attr(html, /<h1[^>]*>([\s\S]*?)<\/h1>/) || '').replace(/<[^>]+>/g, '').trim());

  // 1. Preserva JSON-LD (Yoast) com URLs absolutas
  const ld = [];
  html = html.replace(/<script type=['"]application\/ld\+json['"][^>]*>[\s\S]*?<\/script>/g, (m) => { ld.push(m); return `@@LDJSON${ld.length - 1}@@`; });

  // 2. Seções/blocos inteiros que saem: newsletter (Mailchimp) do rodapé. Troque <data-id> pelo data-id da seção no HTML capturado.
  html = replaceElements(html, /<section class="elementor-section elementor-top-section elementor-element elementor-element-<data-id>[^"]*"[^>]*>/, () => '');
  html = replaceElements(html, /<form id="mc4wp-form-\d+"[^>]*>/, () => '');

  // 3. Formulários do Contact Form 7 -> chamadas para contato
  html = replaceElements(html, /<div class="wpcf7 no-js" id="wpcf7-f(\d+)-[^"]*"[^>]*>/, (_, m) => {
    const id = m[1];
    if (id === '16') return ctaContato();            // "Entre em contato" (rodapé de todas as páginas)
    if (id === '352') return ctaOrcamento(h1);       // "Solicite um orçamento" (páginas de produto)
    if (id === '1691') return ctaVagas();            // "Enviar CV" (Trabalhe Conosco)
    return '';                                       // 202 Newsletter e outros
  });

  // 4. Download After Email -> link direto para a ficha técnica (PDF em /wp-content/uploads/dae-uploads/)
  html = replaceElements(html, /<div id="dae-shortcode\d+-download-wrapper" class="dae-shortcode-download-wrapper">/, (block) => {
    const file = attr(block, /<input type="hidden" name="file" value="([^"]+)"/);
    const label = decode(attr(block, /<span class="dae-shortcode-download-button-text">([^<]*)<\/span>/) || 'Baixe a ficha técnica');
    if (!file) return '';
    return `<div class="dae-shortcode-download-wrapper wpw-download"><div class="dae-shortcode-download-content-wrapper">
<a class="dae-shortcode-download-button" href="/wp-content/uploads/dae-uploads/${encodeURIComponent(file)}" target="_blank" rel="noopener" download><span class="dae-shortcode-download-button-icon"><i class="fas fa-download" aria-hidden="true"></i></span> <span class="dae-shortcode-download-button-text">${esc(label)}</span></a>
</div></div>`;
  });

  // 5. Scripts e estilos de plugins que deixam de existir
  const dropSrc = [
    /contact-form-7\//, /google\.com\/recaptcha/, /mailchimp-for-wp\//, /googlesitekit-events-provider/, /download-after-email\/js\//,
    /comment-reply\.min\.js/, /wp-emoji-release/, /add-search-to-menu\//,
  ];
  html = html.replace(/<script[^>]*\bsrc=['"]([^'"]+)['"][^>]*><\/script>\s*/g, (m, src) => (dropSrc.some((r) => r.test(src)) ? '' : m));
  const dropInlineId = /^(contact-form-7-js-translations|contact-form-7-js-before|wpcf7-recaptcha-js-before|dae-download-js-extra|googlesitekit-events-provider-[a-z0-9-]+-js-before|wp-emoji-settings|ivory-search-scripts-js-extra)$/;
  const dropInlineBody = [/window\._wpemojiSettings/, /window\.mc4wp = window\.mc4wp/, /script#wp-emoji-settings/, /maybePrefixUrlField/];
  html = html.replace(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>\s*/g, (m, attrs, body) => {
    const id = (attrs.match(/\bid=['"]([^'"]+)['"]/) || [])[1] || '';
    if (/type=["']speculationrules["']/.test(attrs)) return ''; // regras de prefetch do WordPress (citam /wp-admin/)
    return dropInlineId.test(id) || dropInlineBody.some((r) => r.test(body)) ? '' : m;
  });
  html = html.replace(/<link[^>]*\bhref=['"][^'"]*(contact-form-7|mailchimp-for-wp|add-search-to-menu)\/[^'"]*['"][^>]*>\s*/g, '');
  html = html.replace(/<style[^>]*>\s*img\.wp-smiley[\s\S]*?<\/style>\s*/g, '');
  // GTM entra duas vezes no WordPress (Site Kit + plugin de scripts): fica só a cópia do plugin de scripts
  html = cutBetween(html, '<!-- Snippet do Gerenciador de Tags do Google adicionado pelo Site Kit -->', '<!-- Fim do snippet do Gerenciador de tags do Google adicionado pelo Site Kit -->');
  html = cutBetween(html, '<!-- Snippet do Gerenciador de tags do Google (sem script) adicionado pelo Site Kit -->', '<!-- Fim do snippet do Gerenciador de tags do Google (sem script) adicionado pelo Site Kit -->');

  // 6. Metadados que só fazem sentido no WordPress
  html = html
    .replace(/<link rel=['"](pingback|EditURI|wlwmanifest|shortlink|https:\/\/api\.w\.org\/)['"][^>]*>\s*/g, '')
    .replace(/<link rel=['"]alternate['"][^>]*(application\/rss\+xml|application\/json|json\+oembed|xml\+oembed)[^>]*>\s*/g, '')
    .replace(/<link rel=['"]dns-prefetch['"] href=['"]\/\/exemplo\.com\.br['"][^>]*>\s*/g, '')
    .replace(/<meta name=['"]generator['"][^>]*>\s*/g, '');

  // 7. Configurações inline que apontam para endpoints do WordPress
  html = html.replace(/"ajax[uU]rl":"[^"]*"/g, '"ajaxurl":""').replace(/"ajax_url":"[^"]*"/g, '"ajax_url":""');

  // 8. Busca -> página estática resolvida no navegador
  html = html.replace(/(<form class="hfe-search-button-wrapper" role="search" action=")[^"]*(")/g, '$1/busca/$2');
  html = html.replace(/(<form[^>]*class="[^"]*search-?form[^"]*"[^>]*action=")[^"]*(")/g, '$1/busca/$2');

  // 9. Rodapé: ano
  html = html.replace(/Nome do Cliente \d{4} ©/g, `Nome do Cliente ${ANO} ©`);

  // 9b. Consertos de referências quebradas que já existiam no WordPress
  html = html.replace(/\/homologacao\/wp-content\/uploads\//g, '/wp-content/uploads/');            // caminho da homologação de 2022
  html = html.replace(/uploads\/2022\/06\/selo\.svg/g, 'uploads/2022/06/selo-novo.svg');      // imagem antiga que não existe mais no servidor

  // 10. URLs absolutas do próprio site -> relativas (inclusive a forma com barras escapadas usada em JSON de atributos)
  html = html.replace(/https?:\\\/\\\/exemplo\.com\.br\\\//g, '\\/');
  html = html.replace(/https?:\/\/exemplo\.com\.br\//g, '/');
  html = html.replace(/(["'(=])\/\/exemplo\.com\.br\//g, '$1/');
  html = html.replace(/(<link rel="canonical" href=")\/(?=[^"]*")/g, `$1${SITE}/`);
  html = html.replace(/(<link rel="(?:next|prev)" href=")\/(?=[^"]*")/g, `$1${SITE}/`);
  html = html.replace(/(<meta (?:property|name)="(?:og|twitter):[a-z:_]+" content=")\/(?=[^"]*")/g, `$1${SITE}/`);
  html = html.replace(/(\/(?:blog|category\/[^/"]+|tag\/[^/"]+))\/page\/1\//g, '$1/');

  // 11. CSS/JS próprios do site estático
  html = html.replace(/<\/head>/, '<link rel="stylesheet" href="/assets/site.css">\n</head>');
  html = html.replace(/<\/body>/, '<script src="/assets/site.js" defer></script>\n</body>');

  html = html.replace(/@@LDJSON(\d+)@@/g, (_, i) => ld[+i]);
  return html;
}

function buildSearchPage(rawHtml) {
  let html = transform(rawHtml, '/busca/');
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>Busca - ${SITE_NAME}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${SITE}/busca/"`)
    .replace(/<meta name="robots" content="[^"]*"/, '<meta name="robots" content="noindex, follow"');
  // conteúdo: substitui a lista de resultados do WordPress pelo contêiner preenchido no navegador
  html = replaceElements(html, /<div id="content" class="site-content clr">/, () => '<div id="content" class="site-content clr"><h1 class="wpw-busca-titulo"><span id="search-title">Buscando…</span></h1><div id="search-results" class="wpw-busca-resultados"></div></div>');
  html = html.replace(/<\/body>/, '<script src="/assets/site-search.js" defer></script>\n</body>');
  if (!html.includes('<meta name="robots"')) html = html.replace('</head>', '<meta name="robots" content="noindex, follow" />\n</head>');
  return html;
}

function sitemapEntries() {
  const entries = [];
  for (const f of ['page', 'post', 'category', 'post_tag']) {
    const file = join(SITEMAPS, `${f}-sitemap.xml`);
    if (!existsSync(file)) continue;
    const xml = readFileSync(file, 'utf8');
    for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const loc = attr(m[1], /<loc>([^<]+)<\/loc>/);
      const lastmod = attr(m[1], /<lastmod>([^<]+)<\/lastmod>/);
      if (loc && !/\.(jpe?g|png|gif|svg|webp|pdf)$/i.test(loc)) entries.push({ loc, lastmod, type: f });
    }
  }
  return entries;
}

function textOf(html) {
  const main = attr(html, /<main[\s\S]*?>([\s\S]*?)<\/main>/) || attr(html, /<body[^>]*>([\s\S]*?)<\/body>/);
  return decode(main.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<footer[\s\S]*$/, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 3000);
}

// ---------- execução ----------
const pages = walk(RAW).filter((f) => f.endsWith('index.html'));
// limpa HTML gerado anteriormente (mantém assets, uploads e tema/plugins copiados)
for (const f of walk(OUT)) if (f.endsWith('.html') && !/^(wp-content|wp-includes|assets)\//.test(relative(OUT, f))) unlinkSync(f);

const manifest = [];
let count = 0;
for (const file of pages) {
  const rel = relative(RAW, file);
  if (/(^|\/)page\/1\/index\.html$/.test(rel)) continue;
  const pathname = '/' + rel.replace(/index\.html$/, '');
  const raw = readFileSync(file, 'utf8');
  const html = transform(raw, pathname);
  write(join(OUT, rel), html);
  manifest.push({ path: pathname, title: decode(attr(html, /<title>([^<]*)<\/title>/)).replace(new RegExp(` - ${SITE_NAME}$`), '') });
  count++;
}
write(join(OUT, '404.html'), transform(readFileSync(join(RAW, '404.html'), 'utf8'), '/404'));
write(join(OUT, 'busca', 'index.html'), buildSearchPage(readFileSync(join(RAW, 'busca-raw.html'), 'utf8')));

// manifesto das páginas (usado pela área de gestão)
manifest.sort((a, b) => a.path.localeCompare(b.path));
write(join(OUT, 'pages.json'), JSON.stringify(manifest));

// índice de busca: páginas (produtos etc.) e posts
const entries = sitemapEntries();
const index = entries.filter((e) => e.type === 'page' || e.type === 'post').map((e) => {
  const rel = (e.loc.replace(SITE + '/', '') || '') + 'index.html';
  const file = join(RAW, rel);
  if (!existsSync(file)) return null;
  const html = transform(readFileSync(file, 'utf8'), '/' + rel.replace(/index\.html$/, ''));
  const url = e.loc.replace(SITE, '') || '/';
  return {
    url,
    title: decode(attr(html, /<meta property="og:title" content="([^"]*)"/) || attr(html, /<title>([^<]*)<\/title>/)).replace(new RegExp(` - ${SITE_NAME}$`), ''),
    excerpt: decode(attr(html, /<meta property="og:description" content="([^"]*)"/) || attr(html, /<meta name="description" content="([^"]*)"/)).slice(0, 300),
    image: attr(html, /<meta property="og:image" content="([^"]*)"/).replace(SITE, ''),
    type: url.startsWith('/produtos/') ? 'produto' : e.type === 'post' ? 'post' : 'pagina',
    date: attr(html, /<meta property="article:published_time" content="([^"]*)"/),
    text: textOf(html),
  };
}).filter(Boolean);
write(join(OUT, 'search-index.json'), JSON.stringify(index));

// sitemap.xml + robots.txt
const urlset = entries.map((e) => `  <url>\n    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}\n  </url>`).join('\n');
write(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n</urlset>\n`);
write(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /busca/\nDisallow: /wp-admin/\nDisallow: /wp-login.php\n\nSitemap: ${SITE}/sitemap.xml\n`);

// _redirects e _headers (Workers Static Assets)
const paged = pages.map((f) => relative(RAW, f)).filter((r) => /(^|\/)page\/1\/index\.html$/.test(r)).map((r) => '/' + r.replace(/page\/1\/index\.html$/, ''));
write(join(OUT, '_redirects'), [
  ...paged.map((base) => `${base}page/1/ ${base} 301`),
  '/feed/ /blog/ 301',
  '/feed /blog/ 301',
  '/comments/feed/ /blog/ 301',
  '/blog/feed/ /blog/ 301',
  '/xmlrpc.php / 301',
  '/pagina-duplicada-2/ / 301',
  '/post-antigo/ /post-novo/ 301',
  '/outro-post-antigo/ /post-novo/ 301',
  '',
].join('\n'));
write(join(OUT, '_headers'), [
  '/*',
  '  X-Frame-Options: SAMEORIGIN',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '/wp-content/uploads/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '/wp-content/themes/*',
  '  Cache-Control: public, max-age=604800',
  '/wp-content/plugins/*',
  '  Cache-Control: public, max-age=604800',
  '/wp-includes/*',
  '  Cache-Control: public, max-age=604800',
  '/assets/*',
  '  Cache-Control: public, max-age=600',
  '/search-index.json',
  '  Cache-Control: public, max-age=3600',
  '/pages.json',
  '  Cache-Control: no-store',
  '',
].join('\n'));

console.log(`build ok: ${count} páginas + 404 + busca, ${index.length} itens no índice de busca, ${entries.length} URLs no sitemap`);
