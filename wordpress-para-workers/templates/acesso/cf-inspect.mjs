// Inspects Cloudflare zones using wrangler's stored OAuth token. The token is never printed.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
const toml = readFileSync(`${homedir()}/Library/Preferences/.wrangler/config/default.toml`, 'utf8');
const token = toml.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
if (!token) { console.error('no oauth token found'); process.exit(1); }
const api = async (path) => {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json();
  if (!j.success) return { error: j.errors };
  return j.result;
};
const targets = ['dominio-antigo.com.br', 'dominio-antigo-2.com.br', 'exemplo.com.br'];
const zones = await api('/zones?per_page=50');
if (zones.error) { console.log('zones error', JSON.stringify(zones.error)); process.exit(1); }
console.log('ALL ZONES:');
for (const z of zones) console.log(` - ${z.name}  id=${z.id}  status=${z.status}  plan=${z.plan?.name}  ns=${(z.name_servers||[]).join(',')}`);
for (const name of targets) {
  const z = zones.find(x => x.name === name);
  console.log(`\n=== ${name} ===`);
  if (!z) { console.log('  (zone NOT in this account)'); continue; }
  const dns = await api(`/zones/${z.id}/dns_records?per_page=100`);
  if (dns.error) console.log('  dns error', JSON.stringify(dns.error));
  else for (const r of dns) console.log(`  DNS ${r.type.padEnd(5)} ${r.name.padEnd(35)} -> ${r.content}  proxied=${r.proxied}`);
  const rs = await api(`/zones/${z.id}/rulesets`);
  if (rs.error) console.log('  rulesets error', JSON.stringify(rs.error));
  else {
    const mine = rs.filter(r => r.kind === 'zone');
    console.log(`  zone rulesets: ${mine.length ? mine.map(r => `${r.phase}(${r.id})`).join(', ') : '(none)'}`);
    for (const r of mine) {
      if (r.phase === 'http_request_dynamic_redirect') {
        const full = await api(`/zones/${z.id}/rulesets/${r.id}`);
        console.log('  redirect ruleset:', JSON.stringify(full.rules?.map(x => ({ desc: x.description, expr: x.expression, enabled: x.enabled, params: x.action_parameters })), null, 2));
      }
    }
  }
}
