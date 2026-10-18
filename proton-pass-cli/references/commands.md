# Command reference (pass-cli 2.4.2)

Checked against `pass-cli <command> --help` of 2.4.2. If a flag is missing in the installed version, trust
`--help`.

**Default deny:** only the commands in "Safe for the agent" and "Reading secrets" run without asking. Everything
else, including commands not listed here, needs explicit human confirmation.

## Safe for the agent (no secret values)

| Command | Purpose |
|---|---|
| `pass-cli --version` | Installed version |
| `pass-cli info [--output json]` | Session details; exit `0` = logged in |
| `pass-cli vault list [--output json]` | Vaults the agent can reach |
| `pass-cli share list [--only-vaults true] [--only-items true] [--output json]` | Vault and item shares granted to the agent |
| `pass-cli item list --vault-name <V> [--filter-type <T>] [--filter-state active] [--output json]` | Item metadata of a vault |
| `pass-cli item list --share-id <ID> [--output json]` | Same, by Share ID |
| `pass-cli agent monitor [--limit <N>] [--output json]` | The agent's own audit log (no name needed in an agent session) |
| `pass-cli agent instructions` | Proton's generated agent instructions (needs a session) |
| `pass-cli password generate random\|passphrase` | Generate a password (prints it: treat the output as a secret) |
| `pass-cli settings view` | Show persistent settings |
| `pass-cli logout`, `pass-cli logout --force` | End the session (only with `PROTON_PASS_SESSION_DIR` set: otherwise it logs the human out) |

- `--filter-type` accepts `note`, `login`, `alias`, `credit-card`, `identity`, `ssh-key`, `wifi`, `custom`.
- Always pass `--vault-name` or `--share-id` to `item list`; without them the CLI falls back to a default vault
  setting, if one is configured.
- `item list --show-secrets` is not allowed in agent sessions; do not try it.
- Never log in with a bare `pass-cli login`; use `pass_login` from SKILL.md ("Session setup").

## Reading secrets

`PROTON_PASS_AGENT_REASON` is **required** on `item view` and **recommended** on `run`, `inject` and `item totp`.

```bash
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view --vault-name "<V>" --item-title "<T>" --field <field>
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view --share-id <SHARE_ID> --item-id <ITEM_ID> --field <field>
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view "pass://<V>/<T>/<field>"
PROTON_PASS_AGENT_REASON="<why>" pass-cli item totp --vault-name "<V>" --item-title "<T>"
PROTON_PASS_AGENT_REASON="<why>" pass-cli run --env-file <file> -- <command>
PROTON_PASS_AGENT_REASON="<why>" pass-cli inject --in-file <template> --out-file <file>
```

`item view` also accepts `--output json`. Usage and caveats: `secrets.md`.

## Changing data (reason required, only when the user asked for it)

Run only when the user asked for this exact change. Confirm vault, item and fields before running.

```bash
pass-cli item create login --help
PROTON_PASS_AGENT_REASON="<why>" pass-cli item update --vault-name "<V>" --item-title "<T>" --field "<name>=<value>"
```

- `item create` has the subcommands `login`, `note`, `credit-card`, `wifi`, `custom`, `identity`, `ssh-key`; check
  `pass-cli item create <type> --help` for the fields of each, and set `PROTON_PASS_AGENT_REASON` when running it.
- The `item update` example is for **non-secret fields only** (title, URL, username). `--field` puts the value in
  the command line, where it shows up in `ps`. For secret values, ask the human to update them in the Proton Pass
  app.

## Requires explicit human confirmation every time

Show the exact command and target and wait for a "yes". These destroy data, move it, change who can see it, touch
keys outside Proton Pass or change the CLI itself.

| Command | Effect |
|---|---|
| `pass-cli item delete --share-id <ID> --item-id <ID>` | Deletes permanently |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli item trash --vault-name <V> --item-title <T>` | Moves to trash |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli item untrash --vault-name <V> --item-title <T>` | Restores from trash |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli item move --from-vault-name <V> --item-title <T> --to-vault-name <V2>` | Moves to another vault |
| `pass-cli item share --share-id <ID> --item-id <ID> <email>` | Shares an item with someone |
| `pass-cli item member update\|remove ...` | Changes who can access an item |
| `pass-cli item alias create ...` | Creates an e-mail alias |
| `pass-cli item attachment download ...` | Writes an attachment (possibly a secret file) to disk |
| `pass-cli vault create --name <NAME>` | Creates a vault |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli vault update --vault-name <V> --name <NEW>` | Renames a vault |
| `pass-cli vault delete --vault-name <V>` | Deletes a vault and its items |
| `pass-cli vault share ...`, `pass-cli vault member ...`, `pass-cli vault transfer ...` | Vault sharing, membership and ownership |
| `pass-cli invite accept\|reject ...` | Accepts or rejects a pending invite |
| `pass-cli ssh-agent start\|load\|daemon ...` | Loads private keys into an SSH agent that outlives the task |
| `pass-cli session create-lock\|lock\|unlock\|remove-lock` | Session lock management |
| `pass-cli settings set\|unset ...` | Changes persistent CLI settings |
| `pass-cli update` | Downloads and installs a new CLI binary |
| `pass-cli user generate-report` | Organization user report |
| `pass-cli agent create\|delete\|renew\|access ...` | Agent management: belongs to the human |
| `pass-cli personal-access-token ...` | PAT management: belongs to the human |

`agent renew` invalidates the current token immediately: running it from the agent breaks its own session.

Not available in 2.4.2: `pass-cli test` (use `pass-cli info`), `item view --item-name` (use `--item-title`).
