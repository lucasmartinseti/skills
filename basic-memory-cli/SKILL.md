---
name: basic-memory-cli
description: Use the `bm` or `basic-memory` CLI to manage Basic Memory from the terminal, including local/cloud routing, MCP server operation, project management, schema validation/inference, sync flows, and note tool commands. Trigger this skill whenever the user mentions Basic Memory CLI, `bm`, `basic-memory`, cloud sync, MCP server setup, schema commands, or wants to script note operations via terminal.
---

# Basic Memory CLI (`bm`) Skill

`bm` is the command-line interface for Basic Memory. Use it for local and cloud workflows, project routing, schema lifecycle, and MCP tool wrappers.

Use `bm` (short alias) or `basic-memory` (full command). Prefer `bm` in examples and scripts.

## Routing and Defaults

- Use `--local` to force local routing.
- Use `--cloud` to force cloud routing.
- Use `--project <name>` to target a specific project.
- If `--project` is omitted, Basic Memory falls back to `default_project` when configured.

## Command Reference by Domain

Read the relevant reference file before answering or executing commands:

| Domain | File | When to read |
|--------|------|--------------|
| Core commands | `references/core.md` | Status, diagnostics, MCP server, indexing, reset, formatting |
| Projects | `references/project.md` | Project creation/removal/default/path/routing |
| Cloud | `references/cloud.md` | Auth, API keys, setup, sync, snapshots, restore, workspaces |
| Schema | `references/schema.md` | Validate, infer, and diff schema definitions |
| Tools (`bm tool`) | `references/tools.md` | CLI wrappers around MCP tools |
| Import | `references/import.md` | Importing Claude, ChatGPT, and JSON exports |
| Full extracted reference | `references/cli-reference.md` | Full CLI reference captured from docs.basicmemory.com |

## Common Workflows

### Check local health and sync state

```bash
bm status --verbose
bm doctor
```

### Start MCP server for AI clients

```bash
bm mcp
bm mcp --project main
bm mcp --transport streamable-http --port 8000
```

### Cloud onboarding and sync

```bash
bm cloud login
bm cloud setup
bm cloud sync
bm cloud bisync
```

### Project lifecycle

```bash
bm project add research ~/Documents/research --default
bm project info research
bm project ls --name research
```

### Schema lifecycle

```bash
bm schema infer person --save
bm schema validate person --strict
bm schema diff person
```

### Tool commands for scripting

```bash
bm tool write-note --title "API Notes" --folder specs --content "# API Notes"
bm tool search-notes "authentication" --hybrid
bm tool recent-activity --timeframe 30d
```

## Safety Notes

- `bm reset` drops and recreates database tables (files are not deleted).
- `bm project remove --delete-notes` deletes project files from disk.
- `bm cloud restore` writes snapshot contents back to local paths; verify target path first.
- `bm cloud api-key create` requires a logged-in OAuth session (`bm cloud login` first).

## Tips

- Use `bm <command> --help` for command-specific flags.
- `bm tool` subcommands support `--workspace` for cloud workspace targeting.
- When the user asks for machine parsing, prefer `--json` where available.
