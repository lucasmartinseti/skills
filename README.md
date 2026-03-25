# skills

Skills para agentes de IA. Instale via [npx skills](https://github.com/vercel-labs/skills).

## Skills disponíveis

| Skill | Descrição |
|-------|-----------|
| `bitbucket-cli` | Usa o `bb` CLI para interagir com o Bitbucket Cloud (PRs, repos, pipelines, issues, perfis) |

## Instalação

```bash
# Do registry (após publicação)
skills add bitbucket-cli

# Do GitHub diretamente
skills add https://github.com/lucasmartinseti/skills/tree/main/bitbucket-cli
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
