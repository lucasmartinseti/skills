# skills

Skills para agentes de IA. Instale via [npx skills CLI](https://www.npmjs.com/package/skills).

## Skills disponíveis

| Skill | Descrição |
|-------|-----------|
| `bitbucket-cli` | Usa o `bb` CLI para interagir com o Bitbucket Cloud (PRs, repos, pipelines, issues, perfis) |

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
