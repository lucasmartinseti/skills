# skill-bb-cli

Skills para agentes de IA. Instale via [npx skills](https://github.com/vercel-labs/skills).

## Skills disponíveis

| Skill | Descrição |
|-------|-----------|
| `bitbucket-cli` | Usa o `bb` CLI para interagir com o Bitbucket Cloud (PRs, repos, pipelines, issues, perfis) |

## Instalação

```bash
npx skills add lucasmartinseti/skill-bb-cli
```

## Skills

### bitbucket-cli

Skill para o [`bb` CLI](https://github.com/gildas/bitbucket-cli) — a CLI não-oficial do Bitbucket Cloud.

Cobre:
- Autenticação (perfis OAuth, API Token, Access Token)
- Pull Requests (criar, aprovar, mergear, comentar)
- Repositórios (clone, criar, deletar, fork)
- Pipelines (trigger, steps, logs)
- Issues, Artifacts, SSH/GPG Keys, Cache, Completion
