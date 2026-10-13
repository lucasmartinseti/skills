// Gera o hash de senha da área de gestão (formato aceito pelo Worker) e, opcionalmente, uma senha forte.
// Uso: node scripts/senha.mjs              -> gera senha aleatória e imprime senha + hash
//      node scripts/senha.mjs "minha senha" -> imprime o hash da senha informada
// Depois: npx wrangler secret put ADMIN_PASSWORD_HASH   (cole o hash)
import { webcrypto as crypto } from 'node:crypto';

const enc = new TextEncoder();
const b64u = (buf) => Buffer.from(buf).toString('base64url');
async function hashPassword(senha, iterations = 150000, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
  return `pbkdf2:${iterations}:${b64u(salt)}:${b64u(bits)}`;
}
const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const gerar = (n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => alfabeto[x % alfabeto.length]).join('');

const senha = process.argv[2] || `${gerar(5)}-${gerar(5)}-${gerar(5)}-${gerar(5)}`;
console.log(JSON.stringify({ senha: process.argv[2] ? '(informada)' : senha, hash: await hashPassword(senha) }, null, 2));
