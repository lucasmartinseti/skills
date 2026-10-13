// Redefine a senha de um usuário da área administrativa direto no KV (sem precisar estar logado).
// Uso: node scripts/redefinir-senha.mjs <login>            -> gera uma senha forte e mostra no terminal
//      node scripts/redefinir-senha.mjs <login> "senha"    -> usa a senha informada (mínimo 10 caracteres)
// O hash original importado do WordPress é preservado no campo `hashWordpress` do registro.
// Precisa do wrangler logado na conta (npx wrangler whoami).
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { webcrypto as crypto } from 'node:crypto';

const [login, senhaInformada] = process.argv.slice(2);
if (!login) { console.error('Uso: node scripts/redefinir-senha.mjs <login> ["senha nova"]'); process.exit(1); }
if (senhaInformada && senhaInformada.length < 10) { console.error('A senha precisa ter pelo menos 10 caracteres.'); process.exit(1); }

const wrangler = (args, input) => execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', input, env: { ...process.env, CI: '1' }, stdio: ['pipe', 'pipe', 'inherit'] });

const atual = wrangler(['kv', 'key', 'get', `user:${login}`, '--binding', 'CONTENT', '--remote', '--text']).split('\n').find((l) => l.startsWith('{'));
if (!atual) { console.error(`Usuário "${login}" não encontrado no KV.`); process.exit(1); }
const u = JSON.parse(atual);

const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const gerar = (n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => alfabeto[x % alfabeto.length]).join('');
const senha = senhaInformada || `${gerar(4)}-${gerar(4)}-${gerar(4)}-${gerar(4)}`;

const enc = new TextEncoder();
const b64u = (b) => Buffer.from(b).toString('base64url');
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);

if (u.origem === 'wordpress' && !u.hashWordpress) u.hashWordpress = u.hash;
u.hash = `pbkdf2:100000:${b64u(salt)}:${b64u(bits)}`;
u.ativo = true;
u.senhaRedefinidaEm = new Date().toISOString();
u.senhaRedefinidaPor = 'scripts/redefinir-senha.mjs';

const dir = mkdtempSync(join(tmpdir(), 'wpw-'));
const file = join(dir, 'user.json');
writeFileSync(file, JSON.stringify(u), { mode: 0o600 });
try {
  wrangler(['kv', 'key', 'put', `user:${login}`, '--path', file, '--binding', 'CONTENT', '--remote']);
} finally {
  unlinkSync(file);
}
console.log(`\nSenha redefinida para ${login} (${u.email || 'sem e-mail'}).`);
console.log(`Senha nova: ${senha}`);
console.log('Guarde no gerenciador de senhas; ela não é mostrada de novo. Pode levar até 1 minuto para valer.');
