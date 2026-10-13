// Copia para public/ apenas os arquivos do WordPress (tema, plugins, wp-includes, uploads) que o site estático
// realmente referencia: varre o HTML gerado e, recursivamente, os CSS (url(...)) e os srcset.
// Fonte: a cópia de backup da pasta do site na DreamHost.
// Uso: BACKUP_FILES=/caminho/para/backup/files node scripts/collect-assets.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, relative, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const MAX_ASSET = 24 * 1024 * 1024;

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'public');
const SRC = resolve(process.env.BACKUP_FILES || join(ROOT, '..', '_backup-dreamhost-exemplo.com.br', 'files'));
if (!existsSync(join(SRC, 'wp-includes'))) { console.error(`pasta de origem não encontrada: ${SRC} (defina BACKUP_FILES)`); process.exit(1); }
// Cópia local usada na renderização (opcional): o Elementor regenera lá os CSS por página (uploads/elementor/css/post-*.css),
// que não existiam todos no servidor. Tem prioridade sobre o backup quando existir.
const RENDER = process.env.RENDER_FILES ? resolve(process.env.RENDER_FILES) : '';
const sources = [RENDER, SRC].filter((d) => d && existsSync(d));

const walk = (d, a = []) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p, a) : a.push(p); } return a; };
const LOCAL = /^\/(wp-content|wp-includes)\//;
const clean = (u) => decodeURIComponent(u.replace(/\\\//g, '/').replace(/^https?:\/\/exemplo\.com\.br/, '').replace(/^\/\/exemplo\.com\.br/, '').split(/[?#]/)[0]);

const wanted = new Set();
const queue = [];
function refsFromHtml(html) {
  const refs = [];
  const h = html.replace(/\\\//g, '/');
  for (const m of h.matchAll(/(?:src|href|data-src|data-bg|data-background|poster|content)=["']([^"']+)["']/g)) refs.push(m[1]);
  for (const m of h.matchAll(/srcset=["']([^"']+)["']/g)) for (const part of m[1].split(',')) refs.push(part.trim().split(/\s+/)[0]);
  for (const m of h.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) refs.push(m[2]);
  // URLs dentro de JSON de atributos (Elementor data-settings, Smart Slider) e scripts inline
  for (const m of h.matchAll(/(?:https?:)?\/\/exemplo\.com\.br(\/wp-(?:content|includes)\/[^"'\s)<>\\]+)/g)) refs.push(m[1]);
  for (const m of h.matchAll(/["'(](\/wp-(?:content|includes)\/[^"'\s)<>\\]+)/g)) refs.push(m[1]);
  return refs;
}
function refsFromCss(css, base) {
  const refs = [];
  for (const m of css.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
    const u = m[2].trim();
    if (/^(data:|https?:\/\/(?!exemplo\.com\.br)|\/\/(?!exemplo\.com\.br)|#)/.test(u)) continue;
    refs.push(u.startsWith('/') || /^https?:/.test(u) || u.startsWith('//') ? u : posix.join(posix.dirname(base), u));
  }
  for (const m of css.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)) refs.push(m[1]);
  return refs;
}
function add(u, from) {
  let p;
  try { p = clean(u); } catch { return; }
  if (!LOCAL.test(p) || p.includes('*') || p.endsWith('/') || !/\.[a-z0-9]{2,5}$/i.test(p)) return;
  p = posix.normalize(p);
  if (wanted.has(p)) return;
  wanted.add(p);
  queue.push(p);
}

const htmls = walk(OUT).filter((f) => f.endsWith('.html'));
for (const f of htmls) for (const r of refsFromHtml(readFileSync(f, 'utf8'))) add(r, f);
// CSS próprios do site também podem referenciar arquivos do WordPress
for (const f of walk(join(OUT, 'assets')).filter((f) => f.endsWith('.css'))) for (const r of refsFromCss(readFileSync(f, 'utf8'), '/assets/' + relative(join(OUT, 'assets'), f))) add(r, f);
// fichas técnicas (todas, mesmo as que nenhuma página ainda referencie)
const dae = join(SRC, 'wp-content', 'uploads', 'dae-uploads');
if (existsSync(dae)) for (const f of readdirSync(dae)) if (!f.startsWith('.')) add('/wp-content/uploads/dae-uploads/' + f);

let copied = 0, missing = [];
while (queue.length) {
  const p = queue.shift();
  const src = sources.map((d) => join(d, p)).find((f) => existsSync(f) && !statSync(f).isDirectory());
  if (!src) { missing.push(p); continue; }
  const dst = join(OUT, p);
  const size = statSync(src).size;
  if (size > MAX_ASSET) {
    // Workers Static Assets aceita até 25 MiB por arquivo: imagens maiores são reduzidas (máx. 2048 px) com o sips do macOS
    if (!existsSync(dst) || statSync(dst).size > MAX_ASSET) {
      mkdirSync(dirname(dst), { recursive: true });
      const r = spawnSync('sips', ['-Z', '2048', src, '--out', dst], { stdio: 'ignore' });
      if (r.status === 0 && existsSync(dst) && statSync(dst).size <= MAX_ASSET) { copied++; console.log(`  reduzido (${(size / 1048576).toFixed(1)} MiB > 25 MiB): ${p}`); }
      else missing.push(`${p} (maior que 25 MiB e não foi possível reduzir)`);
    }
  } else if (!existsSync(dst) || statSync(dst).size !== size) { mkdirSync(dirname(dst), { recursive: true }); copyFileSync(src, dst); copied++; }
  if (p.endsWith('.css')) for (const r of refsFromCss(readFileSync(src, 'utf8'), p)) add(r, p);
}
writeFileSync(join(ROOT, 'raw', 'assets-manifest.txt'), [...wanted].sort().join('\n') + '\n');
console.log(`assets: ${wanted.size} referenciados, ${copied} copiados agora, ${missing.length} não encontrados no backup`);
if (missing.length) console.log(missing.slice(0, 40).map((m) => '  faltando: ' + m).join('\n'));
