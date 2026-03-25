---
name: bitbucket-cli
description: Use the `bb` CLI to interact with Bitbucket Cloud — managing pull requests, repositories, pipelines, issues, workspaces, projects, artifacts, and SSH/GPG keys from the command line. Trigger this skill whenever the user wants to interact with Bitbucket via the `bb` command, asks how to create/merge/approve/decline pull requests, clone or manage repos, trigger or inspect pipelines, manage issues, or set up Bitbucket authentication profiles. Also trigger when the user mentions bitbucket-cli, bb CLI, or wants to automate Bitbucket operations.
metadata:
  author: lucasmartinseti
  version: "1.0.0"
---

# Bitbucket CLI (`bb`) Skill

`bb` is the Bitbucket Cloud CLI. It works in the current git repository by default. Use `--repository workspace/repo` to target a specific repo.

## Global Flags

These flags work on most commands:

| Flag | Description |
|------|-------------|
| `--output json\|yaml\|csv\|tsv\|table` | Change output format (default: table) |
| `--repository workspace/repo` | Target a specific repository |
| `--workspace myworkspace` | Target a specific workspace |
| `--dry-run` | Preview changes without applying them |
| `--profile myprofile` | Use a specific authentication profile |
| `--columns col1,col2` or `--columns all` | Select output columns |
| `--sort col1,col2` | Sort list output |
| `--query 'field > value'` | Filter list output (Bitbucket API query syntax) |
| `--page-length N` | Items per API page (1–100, default: 50) |
| `--stop-on-error` / `--warn-on-error` / `--ignore-errors` | Error handling for bulk operations |

Environment variables: `BB_OUTPUT_FORMAT`, `BB_PROFILE`, `BB_CONFIG`.

## Authentication Profiles

Profiles store credentials. **Set up a profile before any other command.**

### Create a profile

**OAuth 2.0 (Authorization Code — for human login):**
```bash
bb profile create \
  --name myprofile \
  --client-id <id> \
  --client-secret <secret> \
  --callback-port 8080
bb profile authorize myprofile
```

**OAuth 2.0 (Client Credentials — for automation):**
```bash
bb profile create \
  --name myprofile \
  --client-id <id> \
  --client-secret <secret>
# Enable "This is a private consumer" on the Bitbucket OAuth consumer page
```

**API Token (recommended for personal use):**
```bash
bb profile create \
  --name myprofile \
  --user your@email.com \
  --password <api-token>
```

**Access Token (repo/project/workspace token):**
```bash
bb profile create \
  --name myprofile \
  --access-token <token>
```

Useful flags: `--default`, `--default-workspace`, `--default-project`, `--clone-protocol https|git|ssh`, `--no-vault`.

### Profile management

```bash
bb profile list
bb profile get myprofile          # or: bb profile which (for current)
bb profile use myprofile          # set as default
bb profile update myprofile --client-secret <new-secret>
bb profile delete myprofile
```

Profile resolution order: `--profile` flag → `BB_PROFILE` env var → `.git/config` `bitbucket.cli.profile` → default profile → first profile.

## Command Reference by Domain

For detailed command reference, read the relevant file based on the user's task:

| Domain | File | When to read |
|--------|------|--------------|
| Workspaces & Projects | `references/workspaces-projects.md` | Listing workspaces, managing projects, permissions, default reviewers |
| Repositories | `references/repos.md` | Clone, create, update, delete, fork repositories |
| Pull Requests | `references/pullrequests.md` | Create, merge, approve, decline, review PRs and PR comments |
| Pipelines | `references/pipelines.md` | Trigger, stop, inspect pipelines and step logs |
| Issues | `references/issues.md` | Create, update, vote, watch issues and attachments |
| Misc (artifacts, keys, cache) | `references/misc.md` | Downloads/artifacts, SSH/GPG keys, cache, shell completion |

## Common Workflows

### Open a pull request from current branch
```bash
bb pullrequest create \
  --title "feat: my feature" \
  --source "$(git branch --show-current)" \
  --destination main \
  --reviewer default   # uses project default reviewers
```

### Merge the PR for the current branch
```bash
bb pullrequest merge   # auto-detects PR from current branch
```

### Clone a repo
```bash
bb repo clone myworkspace/myrepository
bb repo clone --protocol ssh myrepository   # uses default workspace
```

### Trigger a pipeline
```bash
bb pipeline trigger --branch main
bb pipeline trigger --branch main --variable KEY=VALUE
```

### List open PRs as JSON
```bash
bb pullrequest list --output json
bb pullrequest list --query 'updated_on > 2025-12-31' --state open
```

### Dry-run a destructive operation
```bash
bb repo delete myrepository --dry-run
```

## Tips

- `bb <subcommand> --help` shows full flag reference for any command.
- `pullrequest` can be abbreviated as `pr` in most contexts.
- Most `delete`, `upload`, and `download` commands accept multiple arguments or a file with one arg per line.
- UUIDs can be passed with or without `{}` wrapping.
