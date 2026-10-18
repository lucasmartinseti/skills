# skills

Skills para agentes de IA. Instale via [npx skills CLI](https://www.npmjs.com/package/skills).

## Skills disponíveis

| Skill | Descrição |
|-------|-----------|
| `bitbucket-cli` | Usa o `bb` CLI para interagir com o Bitbucket Cloud (PRs, repos, pipelines, issues, perfis) |
| `basic-memory-cli` | Usa o `bm` CLI para operar o Basic Memory (local/cloud, MCP, projetos, schema e ferramentas) |
| `task-master-cli` | Usa o `task-master` CLI para gerenciar tasks, subtasks, dependências, complexidade e workflow TDD autopilot |
| `jelastic-api` | Interage com a plataforma Jelastic (Virtuozzo Application Platform) via REST API v8.10.1 (ambientes, deploy, scaling, arquivos, SSL, marketplace) |
| `wordpress-para-workers` | Migra um site WordPress (DreamHost, cPanel) para site estático no Cloudflare Workers, com backup verificado, build reproduzível, área `/wp-admin` mínima e virada de domínio |
| `proton-pass-cli` | Usa o `pass-cli` do Proton Pass para o agente obter credenciais com sessão isolada por token, leitura auditada (`PROTON_PASS_AGENT_REASON`) e injeção de segredos sem exibir valores |

## Instalação

```bash
npx skills add lucasmartinseti/skills -a universal -g
```

## Skills

### bitbucket-cli

Skill para o [`bb` Bitbucket-cli](https://github.com/gildas/bitbucket-cli) — a CLI não-oficial do Bitbucket Cloud.

Cobre:
- Autenticação (perfis OAuth, API Token, Access Token)
- Pull Requests (criar, aprovar, mergear, comentar)
- Repositórios (clone, criar, deletar, fork)
- Pipelines (trigger, steps, logs)
- Issues, Artifacts, SSH/GPG Keys, Cache, Completion

#### Instalação

```bash
npx skills add lucasmartinseti/skills --skill bitbucket-cli -a universal -g
```
Obrigado [@gildas](https://github.com/gildas) por disponibilizar [bitbucket-cli](https://github.com/gildas/bitbucket-cli)

---

### basic-memory-cli

Skill para o [`bm` / `basic-memory`](https://docs.basicmemory.com/reference/cli-reference) - CLI do Basic Memory.

Cobre:
- Comandos core (`status`, `doctor`, `mcp`, `reindex`, `reset`, `format`)
- Gestão de projetos (`bm project ...`)
- Fluxos cloud (login, sync, snapshots, restore)
- Schema system (`validate`, `infer`, `diff`)
- Wrapper de ferramentas MCP (`bm tool ...`) e imports

#### Instalação

```bash
npx skills add lucasmartinseti/skills --skill basic-memory-cli -a universal -g
```

---

### task-master-cli

Skill para o [`task-master`](https://docs.task-master.dev) — CLI de gerenciamento de tasks para desenvolvimento orientado por IA.

Cobre:
- Tasks (listar, criar, atualizar, mostrar, gerar, definir status)
- Subtasks (expandir, atualizar, limpar)
- Dependências (adicionar, remover, validar, corrigir)
- Análise de complexidade
- Setup (init, models, parse-prd)
- Autopilot TDD workflow (RED → GREEN → COMMIT)

#### Instalação

```bash
npx skills add lucasmartinseti/skills --skill task-master-cli -a universal -g
```

---

### jelastic-api

Skill para interagir com a plataforma [Jelastic (Virtuozzo Application Platform)](https://docs.jelastic.com/api/8.10.1/public/#!/api) via REST API v8.10.1.

Cobre:
- Autenticação (Signin/Signout, Personal Access Tokens)
- Ambientes (criar, listar, iniciar, parar, clonar, deletar)
- Deploy (via URL, Git/VCS, Build Maven/Gradle)
- Scaling horizontal e vertical de nós
- Gerenciamento de arquivos e leitura de logs
- SSL, domínios externos e IPs
- Marketplace e Cloud Scripting (JPS)
- Billing, quotas e assinaturas

#### Instalação

```bash
npx skills add lucasmartinseti/skills --skill jelastic-api -a universal -g
```

---

### wordpress-para-workers

Skill para migrar um site WordPress de hospedagem compartilhada para site 100% estático no [Cloudflare Workers + Static Assets](https://developers.cloudflare.com/workers/static-assets/).

Cobre:
- Backup integral verificado por MD5 + dump do banco e diagnóstico de uso real
- Renderização local do WordPress a partir do backup (PHP + MySQL locais)
- Captura e build estático (`raw/` → `public/`) com check de resíduos do WordPress
- Worker com área administrativa mínima em `/wp-admin` (mesmos usuários e senhas do WordPress, bloqueio de IP)
- Deploy, virada de domínio com custom domains e Worker de redirects para domínios antigos
- Templates prontos (`wrangler.jsonc`, scripts de build/check, Worker, CI do GitLab) e armadilhas conhecidas

#### Instalação

```bash
npx skills add lucasmartinseti/skills --skill wordpress-para-workers -a universal -g
```

---

### proton-pass-cli

Skill para o [`pass-cli`](https://protonpass.github.io/pass-cli/) — CLI oficial do Proton Pass — usado por um agente de IA para obter credenciais.

Cobre:
- Sessão isolada por agente (`PROTON_PASS_SESSION_DIR`) com login por token de agente/PAT vindo do ambiente
- Descoberta de vaults e itens (`vault list`, `share list`, `item list`)
- Leitura auditada com `PROTON_PASS_AGENT_REASON` e referências `pass://vault/item/field`
- Injeção de segredos sem exibir valores (`pass-cli run`, `pass-cli inject`)
- Recuperação de sessão expirada e confirmação humana antes de operações destrutivas
- Regras que impedem gravar o token ou valores de segredo em arquivos, notas ou logs

#### Instalação

```bash
npx skills add lucasmartinseti/skills --skill proton-pass-cli -a universal -g
```
