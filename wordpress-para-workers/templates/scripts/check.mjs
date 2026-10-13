// Verificação pós-build: nenhuma página pode depender do WordPress (endpoints, formulários, reCAPTCHA),
// nenhum asset local referenciado pode faltar e as URLs do próprio site precisam ser relativas.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('../public', import.meta.url));
const walk = (d, a = []) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, a) : a.push(p); } return a; };
const htmls = walk(OUT).filter((f) => f.endsWith('.html') && !/^(wp-content|wp-includes|assets)\//.test(relative(OUT, f)));

const forbidden = [
  [/wp-json|xmlrpc\.php|wp-login\.php|\/wp-admin\//, 'endpoint do WordPress'],
  [/class="wpcf7|_wpcf7|wpcf7-form|mc4wp-form|dae-shortcode-register|g-recaptcha|recaptcha\/api\.js/, 'formulário/plugin que precisa de PHP'],
  [/"ajax[uU]rl":"[^"]+"|ajax_url":"[^"]+"/, 'URL de AJAX apontando para algum servidor'],
  [/(src|href|action|data-src|data-bg)=["'](https?:)?\/\/exemplo\.com\.br\//, 'URL absoluta do próprio site (deveria ser relativa)'],
  [/Nome do Cliente 202[0-5] ©/, 'ano antigo no rodapé'],
  [/<form\b(?![^>]*action="\/busca\/")(?![^>]*action="(accept|accept_all|reject)")/, 'formulário que não é a busca'],
];
const problems = [];
const missing = new Set();
for (const f of htmls) {
  const html = readFileSync(f, 'utf8');
  const rel = relative(OUT, f);
  const body = html
    .replace(/<link rel="canonical"[^>]*>|<link rel="(?:next|prev)"[^>]*>|<meta (?:property|name)="(?:og|twitter):[^"]*"[^>]*>|<script type=['"]application\/ld\+json['"][^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
  for (const [re, label] of forbidden) {
    const hit = body.match(re);
    if (hit) problems.push(`${rel}: ${label} -> ${hit[0].slice(0, 80)}`);
  }
  const h = html.replace(/\\\//g, '/');
  const refs = [];
  for (const m of h.matchAll(/(?:src|href|data-src|data-bg|poster)=["'](\/[^"'#?]+)/g)) refs.push(m[1]);
  for (const m of h.matchAll(/srcset=["']([^"']+)["']/g)) for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u.startsWith('/')) refs.push(u.split(/[?#]/)[0]); }
  for (const m of h.matchAll(/url\((['"]?)(\/[^'")?#]+)/g)) refs.push(m[2]);
  for (const m of h.matchAll(/["'(](\/wp-(?:content|includes)\/[^"'\s)<>?#]+)/g)) refs.push(m[1]);
  for (const p of refs) {
    if (p.startsWith('//') || p.endsWith('/') || /^\/(busca|wp-admin|api)\//.test(p)) continue;
    if (!/\.[a-z0-9]{2,5}$/i.test(p)) continue;
    let dec; try { dec = decodeURIComponent(p); } catch { dec = p; }
    if (!existsSync(join(OUT, dec))) missing.add(p);
  }
}
for (const p of missing) problems.push(`asset inexistente: ${p}`);
for (const must of ['404.html', 'busca/index.html', 'search-index.json', 'pages.json', 'sitemap.xml', 'robots.txt', '_redirects', '_headers', 'assets/site.css', 'assets/site.js']) if (!existsSync(join(OUT, must))) problems.push(`arquivo obrigatório ausente: ${must}`);
if (problems.length) {
  console.error(`check: ${problems.length} problema(s)\n` + problems.slice(0, 60).join('\n'));
  process.exit(1);
}
console.log(`check ok: ${htmls.length} páginas verificadas, sem dependência do WordPress, sem formulários, sem assets faltando`);
