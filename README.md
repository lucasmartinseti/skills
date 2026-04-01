# skills

Skills para agentes de IA. Instale via [npx skills CLI](https://www.npmjs.com/package/skills).

## Skills disponíveis

| Skill | Descrição |
|-------|-----------|
| `bitbucket-cli` | Usa o `bb` CLI para interagir com o Bitbucket Cloud (PRs, repos, pipelines, issues, perfis) |
| `basic-memory-cli` | Usa o `bm` CLI para operar o Basic Memory (local/cloud, MCP, projetos, schema e ferramentas) |
| `task-master-cli` | Usa o `task-master` CLI para gerenciar tasks, subtasks, dependências, complexidade e workflow TDD autopilot |

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
