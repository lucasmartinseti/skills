// Worker do site exemplo.com.br: serve o site estático (binding ASSETS), aplica as edições feitas na área
// administrativa (guardadas no KV CONTENT) e expõe a própria área administrativa em /wp-admin/ (login em /wp-login.php).
// Sem banco de dados, sem PHP. Redireciona http -> https e www -> apex no domínio final.
import { gestaoApp, gestaoLogin, gestaoBloqueado } from './gestao.js';
import { verifyPassword, hashPassword, hashFormat, signSession, readSession, sessionCookie } from './auth.js';

const ADMIN = '/wp-admin/';
const MAX_HTML = 2 * 1024 * 1024; // tamanho máximo de uma página editada
const MAX_FAILS = 3; // erros de senha seguidos por IP até bloquear
const FAIL_WINDOW = 60 * 60; // segundos: a contagem de erros zera depois desse tempo sem tentativas
const BLOCK_TTL = 24 * 60 * 60; // segundos de bloqueio do IP (ou até um administrador desbloquear)

const SECURITY = {
  'x-frame-options': 'SAMEORIGIN',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
};
const html = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...SECURITY, ...headers } });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...SECURITY } });
const redirect = (to, status = 302, headers = {}) => new Response(null, { status, headers: { location: to, ...headers } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = env.SITE_HOST || 'exemplo.com.br';

    // 1. Domínio final: http -> https e www -> apex num único 301 (no workers.dev nada muda)
    if ((url.hostname === host || url.hostname === `www.${host}`) && (url.protocol === 'http:' || url.hostname === `www.${host}`)) {
      url.protocol = 'https:';
      url.hostname = host;
      return redirect(url.toString(), 301);
    }

    // 2. Busca no formato do WordPress (/?s=termo) -> página de busca estática
    if (url.pathname === '/' && url.searchParams.has('s')) {
      return redirect(`${url.origin}/busca/?s=${encodeURIComponent(url.searchParams.get('s'))}`, 302);
    }

    // 3. Área administrativa (mesmos endereços do WordPress)
    if (url.pathname === '/wp-admin' || url.pathname === '/_gestao' || url.pathname === '/_gestao/') return redirect(`${url.origin}${ADMIN}`, 301);
    if (url.pathname.startsWith(ADMIN) || url.pathname === '/wp-login.php') return admin(request, env, url);

    // 4. Página editada na área administrativa tem prioridade sobre o arquivo publicado
    if (request.method === 'GET' || request.method === 'HEAD') {
      const key = pageKey(url.pathname);
      if (key) {
        const edited = await env.CONTENT.get(key, { cacheTtl: 60 });
        if (edited !== null) return html(request.method === 'HEAD' ? null : edited, 200, { 'cache-control': 'public, max-age=60' });
      }
    }

    // 5. Arquivos publicados. URL antiga com maiúsculas (ex.: /Produtos/Commodities/PP/) -> versão minúscula
    const res = await env.ASSETS.fetch(request);
    if (res.status === 404 && /[A-Z]/.test(url.pathname)) {
      const lower = new URL(url);
      lower.pathname = url.pathname.toLowerCase();
      const probe = await env.ASSETS.fetch(new Request(lower.toString(), { method: 'HEAD' }));
      if (probe.ok) return redirect(lower.toString(), 301);
    }
    return res;
  },
};

// Chave no KV de uma página HTML ("page:/caminho/"); null para arquivos (css, js, imagens...) e áreas reservadas.
export function pageKey(pathname) {
  let p = pathname;
  try { p = decodeURIComponent(p); } catch { /* mantém */ }
  if (p.endsWith('/index.html')) p = p.slice(0, -'index.html'.length);
  const last = p.split('/').pop();
  if (last && /\.[a-z0-9]{2,5}$/i.test(last)) return null;
  if (!p.endsWith('/')) p += '/';
  if (/^\/(wp-admin|wp-content|wp-includes|assets)\//.test(p)) return null;
  return `page:${p}`;
}

// ---------------- área administrativa ----------------
async function admin(request, env, url) {
  if (!env.SESSION_SECRET) return html('<h1>Área administrativa não configurada</h1><p>Falta o segredo SESSION_SECRET no Worker.</p>', 503);
  const route = url.pathname === '/wp-login.php' ? 'login' : url.pathname.slice(ADMIN.length);
  const ip = request.headers.get('cf-connecting-ip') || 'desconhecido';

  if (request.method === 'POST' && !sameOrigin(request, url)) return json({ ok: false, erro: 'Origem inválida.' }, 403);

  // ---- login / logout ----
  if (route === 'login' || route === '') {
    const login = await readSession(request, env.SESSION_SECRET);
    const user = login ? await getUser(env, login) : null;
    if (request.method === 'GET') {
      if (user?.ativo) return route === 'login' ? redirect(`${url.origin}${ADMIN}`) : html(gestaoApp({ user: user.login }));
      if (await env.CONTENT.get(`block:${ip}`)) return html(gestaoBloqueado({ ip }), 403);
      return html(gestaoLogin({}));
    }
    if (request.method === 'POST' && route === 'login') return doLogin(request, env, url, ip);
  }
  if (route === 'logout' && request.method === 'POST') return redirect(`${url.origin}/wp-login.php`, 303, { 'set-cookie': sessionCookie('', 0) });

  // ---- daqui para baixo exige sessão válida de usuário ativo ----
  const login = await readSession(request, env.SESSION_SECRET);
  const user = login ? await getUser(env, login) : null;
  if (!user?.ativo) return route.startsWith('api/') ? json({ ok: false, erro: 'Sessão expirada. Entre novamente.' }, 401) : redirect(`${url.origin}/wp-login.php`);

  if (route === 'api/paginas' && request.method === 'GET') {
    const manifest = await (await env.ASSETS.fetch(new Request(`${url.origin}/pages.json`))).json();
    const edited = await listKeys(env, 'page:');
    return json({ ok: true, paginas: manifest, editadas: edited.map((k) => k.name.slice('page:'.length)) });
  }
  if (route === 'api/pagina' && request.method === 'GET') {
    const key = pageKey(url.searchParams.get('p') || '');
    if (!key) return json({ ok: false, erro: 'Página inválida.' }, 400);
    const path = key.slice('page:'.length);
    const originalRes = await env.ASSETS.fetch(new Request(`${url.origin}${path}`));
    if (!originalRes.ok) return json({ ok: false, erro: 'Página não encontrada.' }, 404);
    const original = await originalRes.text();
    const edited = await env.CONTENT.get(key);
    const prev = await env.CONTENT.get(`prev:${path}`);
    return json({ ok: true, path, html: edited ?? original, original, editada: edited !== null, temAnterior: prev !== null });
  }
  if (route === 'api/pagina' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const key = body && pageKey(String(body.path || ''));
    if (!key || typeof body.html !== 'string') return json({ ok: false, erro: 'Dados inválidos.' }, 400);
    if (body.html.length > MAX_HTML) return json({ ok: false, erro: 'Página grande demais.' }, 413);
    if (!/<html[\s>]/i.test(body.html) || !/<\/html>/i.test(body.html) || !/<main[\s>]/i.test(body.html)) return json({ ok: false, erro: 'O HTML precisa ser um documento completo com <html> e <main>.' }, 400);
    const path = key.slice('page:'.length);
    const current = await env.CONTENT.get(key);
    if (current !== null) await env.CONTENT.put(`prev:${path}`, current);
    await env.CONTENT.put(key, body.html, { metadata: { user: user.login, quando: new Date().toISOString() } });
    return json({ ok: true });
  }
  if (route === 'api/restaurar' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const key = body && pageKey(String(body.path || ''));
    if (!key) return json({ ok: false, erro: 'Dados inválidos.' }, 400);
    const path = key.slice('page:'.length);
    const current = await env.CONTENT.get(key);
    if (current !== null) await env.CONTENT.put(`prev:${path}`, current);
    await env.CONTENT.delete(key);
    return json({ ok: true });
  }
  if (route === 'api/desfazer' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    const key = body && pageKey(String(body.path || ''));
    if (!key) return json({ ok: false, erro: 'Dados inválidos.' }, 400);
    const path = key.slice('page:'.length);
    const prev = await env.CONTENT.get(`prev:${path}`);
    if (prev === null) return json({ ok: false, erro: 'Não há versão anterior.' }, 404);
    const current = await env.CONTENT.get(key);
    await env.CONTENT.put(key, prev, { metadata: { user: user.login, quando: new Date().toISOString(), desfeita: true } });
    if (current !== null) await env.CONTENT.put(`prev:${path}`, current); else await env.CONTENT.delete(`prev:${path}`);
    return json({ ok: true });
  }
  if (route === 'api/exportar' && request.method === 'GET') {
    // Todas as páginas editadas, para o desenvolvedor incorporar ao repositório (raw/html) quando quiser
    const out = {};
    for (const k of await listKeys(env, 'page:')) out[k.name.slice('page:'.length)] = { metadata: k.metadata || null, html: await env.CONTENT.get(k.name) };
    return new Response(JSON.stringify(out, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="exemplo-edicoes-${new Date().toISOString().slice(0, 10)}.json"`, 'cache-control': 'no-store' } });
  }

  // ---- usuários ----
  if (route === 'api/usuarios' && request.method === 'GET') {
    const users = [];
    for (const k of await listKeys(env, 'user:')) {
      const u = JSON.parse(await env.CONTENT.get(k.name));
      users.push({ login: u.login, email: u.email, nome: u.nome, ativo: u.ativo === true, origem: u.origem || 'local', senha: hashFormat(u.hash), ultimoLogin: u.ultimoLogin || null });
    }
    users.sort((a, b) => a.login.localeCompare(b.login));
    return json({ ok: true, usuarios: users, eu: user.login });
  }
  if (route === 'api/usuarios' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ ok: false, erro: 'Dados inválidos.' }, 400);
    const alvo = String(body.login || '').trim();
    if (body.acao === 'novo') {
      if (!/^[A-Za-z0-9@._-]{3,40}$/.test(alvo)) return json({ ok: false, erro: 'Login inválido: use 3 a 40 caracteres (letras, números, @ . _ -).' }, 400);
      if (await env.CONTENT.get(`user:${alvo}`)) return json({ ok: false, erro: 'Já existe um usuário com esse login.' }, 409);
      if (String(body.senha || '').length < 10) return json({ ok: false, erro: 'A senha precisa ter pelo menos 10 caracteres.' }, 400);
      await putUser(env, { login: alvo, email: String(body.email || '').trim().slice(0, 120), nome: String(body.nome || '').trim().slice(0, 80), hash: await hashPassword(String(body.senha)), ativo: true, origem: 'local', criadoPor: user.login, criadoEm: new Date().toISOString() });
      return json({ ok: true });
    }
    const u = await getUser(env, alvo);
    if (!u) return json({ ok: false, erro: 'Usuário não encontrado.' }, 404);
    if (body.acao === 'senha') {
      if (String(body.senha || '').length < 10) return json({ ok: false, erro: 'A senha precisa ter pelo menos 10 caracteres.' }, 400);
      u.hash = await hashPassword(String(body.senha)); u.senhaAlteradaEm = new Date().toISOString(); u.senhaAlteradaPor = user.login;
      await putUser(env, u);
      return json({ ok: true });
    }
    if (body.acao === 'ativo') {
      if (alvo === user.login) return json({ ok: false, erro: 'Não dá para desativar o próprio usuário.' }, 400);
      u.ativo = !!body.ativo; await putUser(env, u);
      return json({ ok: true });
    }
    if (body.acao === 'remover') {
      if (alvo === user.login) return json({ ok: false, erro: 'Não dá para remover o próprio usuário.' }, 400);
      await env.CONTENT.delete(`user:${alvo}`);
      return json({ ok: true });
    }
    return json({ ok: false, erro: 'Ação desconhecida.' }, 400);
  }

  // ---- bloqueios de IP ----
  if (route === 'api/bloqueios' && request.method === 'GET') {
    const bloqueios = [];
    for (const k of await listKeys(env, 'block:')) bloqueios.push({ ip: k.name.slice('block:'.length), ...(JSON.parse((await env.CONTENT.get(k.name)) || '{}')) });
    return json({ ok: true, bloqueios, meuIp: ip });
  }
  if (route === 'api/bloqueios' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body || body.acao !== 'desbloquear' || !body.ip) return json({ ok: false, erro: 'Dados inválidos.' }, 400);
    await env.CONTENT.delete(`block:${body.ip}`);
    await env.CONTENT.delete(`fail:${body.ip}`);
    return json({ ok: true });
  }

  return route.startsWith('api/') ? json({ ok: false, erro: 'Não encontrado.' }, 404) : redirect(`${url.origin}${ADMIN}`);
}

async function doLogin(request, env, url, ip) {
  if (await env.CONTENT.get(`block:${ip}`)) return html(gestaoBloqueado({ ip }), 403);
  const form = await request.formData();
  const loginInformado = String(form.get('log') || form.get('usuario') || '').trim();
  const senha = String(form.get('pwd') || form.get('senha') || '');
  const user = await getUser(env, loginInformado);
  const { ok, rehash } = user?.ativo ? await verifyPassword(senha, user.hash) : { ok: false };
  if (!ok) {
    const fails = Number((await env.CONTENT.get(`fail:${ip}`)) || 0) + 1;
    if (fails >= MAX_FAILS) {
      await env.CONTENT.put(`block:${ip}`, JSON.stringify({ quando: new Date().toISOString(), tentativas: fails, ultimoLogin: loginInformado.slice(0, 40) }), { expirationTtl: BLOCK_TTL });
      await env.CONTENT.delete(`fail:${ip}`);
      return html(gestaoBloqueado({ ip }), 403);
    }
    await env.CONTENT.put(`fail:${ip}`, String(fails), { expirationTtl: FAIL_WINDOW });
    return html(gestaoLogin({ erro: `Usuário ou senha incorretos (${fails} de ${MAX_FAILS}; no ${MAX_FAILS}º erro seguido o seu IP é bloqueado por 24 horas).` }), 401);
  }
  await env.CONTENT.delete(`fail:${ip}`);
  user.ultimoLogin = new Date().toISOString();
  if (rehash) { user.hash = rehash; user.hashMigradoEm = user.ultimoLogin; }
  await putUser(env, user);
  const token = await signSession(user.login, env.SESSION_SECRET);
  return redirect(`${url.origin}${ADMIN}`, 303, { 'set-cookie': sessionCookie(token) });
}

async function getUser(env, login) {
  if (!login) return null;
  const raw = await env.CONTENT.get(`user:${login}`);
  return raw ? JSON.parse(raw) : null;
}
const putUser = (env, u) => env.CONTENT.put(`user:${u.login}`, JSON.stringify(u));

async function listKeys(env, prefix) {
  const keys = [];
  let cursor;
  do {
    const list = await env.CONTENT.list({ prefix, cursor });
    keys.push(...list.keys);
    cursor = list.list_complete ? undefined : list.cursor;
  } while (cursor);
  return keys;
}

function sameOrigin(request, url) {
  const origin = request.headers.get('origin');
  if (origin) return origin === url.origin;
  return request.headers.get('sec-fetch-site') === 'same-origin';
}
