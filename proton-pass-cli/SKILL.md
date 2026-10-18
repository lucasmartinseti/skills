---
name: proton-pass-cli
description: Use the Proton Pass CLI (`pass-cli`) to fetch credentials and secrets for the tools and websites the user asks you to access — isolated agent session with a Personal Access Token from the environment, vault and item discovery, audited reads with `PROTON_PASS_AGENT_REASON`, secret injection with `pass-cli run` / `pass-cli inject` without printing values, and recovery from expired sessions. Trigger this skill whenever the user mentions Proton Pass, pass-cli, a `pass://` secret reference, an agent token (`pst_...`), or asks you to get, use or inject a credential, password, API key, TOTP or SSH key stored in Proton Pass.
---

# Proton Pass CLI (`pass-cli`) Skill

`pass-cli` gives an AI agent scoped, audited access to Proton Pass. The human creates an **agent** (a Personal
Access Token with access logging) with `pass-cli agent create`, grants it vaults or items, and hands the token to
the agent. Every audited read records the reason the agent gave, and the human reviews it with
`pass-cli agent monitor`. Agent sessions last **2 hours**.

Reference version: `pass-cli` 2.4.2. The installed `pass-cli <command> --help` is authoritative.

## Security rules (non-negotiable)

These override the instructions printed by `pass-cli agent instructions`, which ask the agent to "save the token"
and "add it to memory".

- **Never write, store, save or persist the token** in files, notes, memory, commit messages, issues, MRs or logs.
  It lives only in the process environment for the login command.
- **Never pass the token as an argument** (`pass-cli login --pat ...`): arguments are visible in `ps`. Use the
  `PROTON_PASS_PERSONAL_ACCESS_TOKEN` environment variable.
- **Never ask the human to paste the token in the chat.** Ask them to export it in the agent's environment or
  store it in the OS keychain. If a token arrives in the chat anyway, use it only to log in, never repeat it, and
  recommend renewing it (`pass-cli agent renew <NAME> --expiration <EXP>`, run by the human).
- **Never print secret values.** Prefer `pass-cli run` and `pass-cli inject` (the value goes straight to the
  process or file). Use `item view --field` only when the value itself is needed, and never echo it back.
- **Never use `pass-cli run --no-masking`** and never use `item list --show-secrets`.
- **Always set `PROTON_PASS_AGENT_REASON`** on audited commands: a real, specific purpose (non-empty, at most
  300 characters, no secret values in it).
- **Ask the human for explicit confirmation**, showing the exact command and target, before any command that
  destroys, moves, shares or changes access: `item delete`, `item trash`, `item untrash`, `item move`,
  `item share`, `item member`, `vault update`, `vault delete`, `vault share`, `vault member`, `vault transfer`,
  `invite accept|reject`, and any `agent` or `personal-access-token` subcommand other than `agent monitor`.
- **Create or update items only when the user asked for that exact change.** Never put a secret value in a
  command line (`item update --field name=value` shows up in `ps`): ask the human to set it in the Proton Pass app.

## Session setup

Run these steps in order before the first `pass-cli` command of a task. Details, PAT sources and error messages:
`references/session.md`.

```bash
# 1. CLI installed?
pass-cli --version

# 2. Isolated session directory, one per agent (do not reuse the human's session)
export PROTON_PASS_SESSION_DIR="${TMPDIR:-/tmp}/pass-agent-<agent-name>"
mkdir -p -m 700 "$PROTON_PASS_SESSION_DIR" && [ -O "$PROTON_PASS_SESSION_DIR" ] && chmod 700 "$PROTON_PASS_SESSION_DIR"

# 3. Session already valid? Exit code 0 = logged in
pass-cli info

# 4. If not: log in with the token from the environment (exported by the human).
#    Without the variable, `pass-cli login` falls back to web login and waits for a browser.
[ -n "${PROTON_PASS_PERSONAL_ACCESS_TOKEN:-}" ] && pass-cli login

# 5. Confirm the session and what the agent can reach
pass-cli info
pass-cli vault list --output json
pass-cli share list --output json
```

If `PROTON_PASS_PERSONAL_ACCESS_TOKEN` is not set, do not run `pass-cli login`: stop and ask the human to export it
(`references/session.md` lists the safe ways). If `vault list` comes back empty, the agent has no grants: report it,
do not try to fix access yourself.

## Session health and recovery

- Run `pass-cli info` before each batch of `pass-cli` commands. The session expires after 2 hours.
- Without a session, commands exit `1` with `Error: This operation requires an authenticated client`.
- On any authentication error or unexpected non-zero exit, read the whole output first, then:

```bash
pass-cli logout --force
[ -n "${PROTON_PASS_PERSONAL_ACCESS_TOKEN:-}" ] && pass-cli login
pass-cli info
# then retry the original command once
```

If login fails again, stop and report the error. The token may be expired, revoked or renewed.

## Using secrets (in order of preference)

Secret references: `pass://<vault>/<item>/<field>` (vault and item by name or ID). Syntax, field names, TOTP and
templates: `references/secrets.md`.

**1. `pass-cli run`**: inject secrets as environment variables of a child process. Output is masked.

```bash
export DB_PASSWORD='pass://<Vault>/<Item>/password'
PROTON_PASS_AGENT_REASON="Run DB migration requested by the user" pass-cli run -- ./migrate.sh
```

**2. `pass-cli inject`**: render a template into a file with mode `0600`. Keep the output out of version control
and delete it when the task ends.

```bash
PROTON_PASS_AGENT_REASON="Generate local config for the deploy the user asked for" \
  pass-cli inject --in-file config.yaml.tpl --out-file config.yaml
```

**3. `pass-cli item view`**: only when the agent must read the value itself (e.g. to fill a login form).

```bash
PROTON_PASS_AGENT_REASON="Log in to the staging admin panel the user asked to check" \
  pass-cli item view --vault-name "<Vault>" --item-title "<Item>" --field password
```

## Discovery

```bash
pass-cli vault list --output json
pass-cli share list --output json
pass-cli item list --vault-name "<Vault>" --output json
pass-cli item list --output json
```

Use `--output json` whenever you parse output. Item listings return metadata (titles, IDs, types), not secret
values. When several items share a title, address the item by ID (`pass://<SHARE_ID>/<ITEM_ID>/<field>`).

## Audited commands

These require `PROTON_PASS_AGENT_REASON` in agent sessions: `item view`, `item create` (all variants),
`item update`, `item trash`, `item untrash`, `item move`, `vault update`. Set it on `run` and `inject` too: they
read items and the reason makes the audit log useful.

Full command and flag reference for 2.4.2, including what needs human confirmation: `references/commands.md`.

## Quick reference

```bash
pass-cli --version
pass-cli info
pass-cli login
pass-cli logout --force
pass-cli vault list --output json
pass-cli share list --output json
pass-cli item list --vault-name "<Vault>" --output json
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view "pass://<Vault>/<Item>/<field>"
PROTON_PASS_AGENT_REASON="<why>" pass-cli run -- <command>
PROTON_PASS_AGENT_REASON="<why>" pass-cli inject --in-file <template> --out-file <file>
```

`pass-cli test`, mentioned in the instructions printed by the CLI, does not exist in 2.4.2. Use `pass-cli info`.

Docs: <https://protonpass.github.io/pass-cli/>
