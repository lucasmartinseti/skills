// Senhas e sessão da área administrativa.
// Aceita os hashes que vieram do WordPress (bcrypt do WP 6.8+ e phpass antigo) e o formato próprio (PBKDF2, WebCrypto).
// No primeiro login com sucesso um hash do WordPress é regravado em PBKDF2 (mais leve de verificar no Worker).
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

export const SESSION_COOKIE = 'wpw_wp_sessao';
export const SESSION_TTL = 8 * 60 * 60; // 8 horas

const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

// ---- PBKDF2 (formato próprio): "pbkdf2:<iterações>:<salt>:<hash>" ----
export async function hashPassword(senha, iterations = 100000, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return `pbkdf2:${iterations}:${b64u(salt)}:${b64u(bits)}`;
}
async function verifyPbkdf2(senha, stored) {
  const [, iter, salt, hash] = stored.split(':');
  if (!iter || !salt || !hash) return false;
  const calc = (await hashPassword(senha, Number(iter), unb64u(salt))).split(':')[3];
  const a = enc.encode(calc), b = enc.encode(hash);
  return a.length === b.length && crypto.subtle.timingSafeEqual(a, b);
}

// ---- bcrypt do WordPress 6.8+: "$wp$2y$10$..." = bcrypt( base64( hmac_sha384( trim(senha), 'wp-sha384' ) ) ) ----
// Igual a wp_hash_password()/wp_check_password() do core (wp-includes/pluggable.php); o login do WP faz trim na senha.
async function verifyWpBcrypt(senha, stored) {
  const key = await crypto.subtle.importKey('raw', enc.encode('wp-sha384'), { name: 'HMAC', hash: 'SHA-384' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(senha.trim()));
  const input = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return bcrypt.compare(input, stored.slice(3));
}

// ---- phpass (WordPress até 6.7): "$P$B" + salt(8) + 22 chars ----
const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function phpassEncode64(input, count) {
  let output = '', i = 0;
  do {
    let value = input[i++];
    output += ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    output += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    output += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    output += ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return output;
}
function verifyPhpass(senha, stored) {
  if (stored.length !== 34) return false;
  const countLog2 = ITOA64.indexOf(stored[3]);
  if (countLog2 < 7 || countLog2 > 30) return false;
  let count = 1 << countLog2;
  const salt = stored.slice(4, 12);
  const pw = Buffer.from(senha, 'utf8');
  let hash = createHash('md5').update(Buffer.concat([Buffer.from(salt, 'utf8'), pw])).digest();
  do { hash = createHash('md5').update(Buffer.concat([hash, pw])).digest(); } while (--count);
  const calc = stored.slice(0, 12) + phpassEncode64(hash, 16);
  const a = enc.encode(calc), b = enc.encode(stored);
  return a.length === b.length && crypto.subtle.timingSafeEqual(a, b);
}

export function hashFormat(stored) {
  if (!stored) return 'sem senha';
  if (stored.startsWith('pbkdf2:')) return 'PBKDF2';
  if (stored.startsWith('$wp$2y$')) return 'bcrypt (WordPress)';
  if (stored.startsWith('$2y$') || stored.startsWith('$2a$') || stored.startsWith('$2b$')) return 'bcrypt';
  if (stored.startsWith('$P$') || stored.startsWith('$H$')) return 'phpass (WordPress antigo)';
  return 'desconhecido';
}

// Devolve { ok, rehash } — rehash vem preenchido quando o hash antigo deve ser trocado pelo formato próprio.
export async function verifyPassword(senha, stored) {
  if (!senha || !stored) return { ok: false };
  try {
    if (stored.startsWith('pbkdf2:')) return { ok: await verifyPbkdf2(senha, stored) };
    if (stored.startsWith('$wp$2y$')) { const ok = await verifyWpBcrypt(senha, stored); return { ok, rehash: ok ? await hashPassword(senha) : undefined }; }
    if (/^\$2[aby]\$/.test(stored)) { const ok = await bcrypt.compare(senha, stored); return { ok, rehash: ok ? await hashPassword(senha) : undefined }; }
    if (stored.startsWith('$P$') || stored.startsWith('$H$')) { const ok = verifyPhpass(senha, stored); return { ok, rehash: ok ? await hashPassword(senha) : undefined }; }
  } catch {
    return { ok: false };
  }
  return { ok: false };
}

// ---- sessão: cookie assinado com HMAC-SHA256 (SESSION_SECRET) ----
async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function signSession(login, secret) {
  const payload = b64u(enc.encode(JSON.stringify({ u: login, exp: Math.floor(Date.now() / 1000) + SESSION_TTL })));
  const sig = b64u(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload)));
  return `${payload}.${sig}`;
}
export async function readSession(request, secret) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!m) return null;
  const [payload, sig] = m[1].split('.');
  if (!payload || !sig) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), unb64u(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(unb64u(payload)));
    if (!data.u || !data.exp || data.exp < Date.now() / 1000) return null;
    return data.u;
  } catch {
    return null;
  }
}
export const sessionCookie = (token, maxAge = SESSION_TTL) => `${SESSION_COOKIE}=${token}; Path=/wp-admin; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
