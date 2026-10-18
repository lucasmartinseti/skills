# Command reference (pass-cli 2.4.2)

Checked against `pass-cli <command> --help` of 2.4.2. If a flag is missing in the installed version, trust
`--help`.

## Safe for the agent (read-only)

| Command | Purpose |
|---|---|
| `pass-cli --version` | Installed version |
| `pass-cli info [--output json]` | Session details; exit `0` = logged in |
| `pass-cli vault list [--output json]` | Vaults the agent can reach |
| `pass-cli share list [--only-vaults true] [--only-items true] [--output json]` | Vault and item shares granted to the agent |
| `pass-cli item list [--vault-name <V> \| --share-id <ID>] [--filter-type <T>] [--filter-state active] [--output json]` | Item metadata |
| `pass-cli agent monitor [--limit <N>] [--output json]` | The agent's own audit log (no name needed in an agent session) |
| `pass-cli settings --help` | Inspect settings options |

`--filter-type` accepts `note`, `login`, `alias`, `credit-card`, `identity`, `ssh-key`, `wifi`, `custom`.
`item list --show-secrets` is not allowed in agent sessions; do not try it.

## Reading secrets (audited, reason required)

```bash
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view --vault-name "<V>" --item-title "<T>" --field <field>
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view --share-id <SHARE_ID> --item-id <ITEM_ID> --field <field>
PROTON_PASS_AGENT_REASON="<why>" pass-cli item view "pass://<V>/<T>/<field>"
PROTON_PASS_AGENT_REASON="<why>" pass-cli run --env-file <file> -- <command>
PROTON_PASS_AGENT_REASON="<why>" pass-cli inject --in-file <template> --out-file <file>
```

`item view` also accepts `--output json`. Usage and caveats: `secrets.md`.

## Changing data (audited, reason required, user must ask for it)

Run only when the user asked for this exact change. Confirm vault, item and fields before running.

```bash
PROTON_PASS_AGENT_REASON="<why>" pass-cli item create login --help
PROTON_PASS_AGENT_REASON="<why>" pass-cli item update --vault-name "<V>" --item-title "<T>" --field "<name>=<value>"
```

- `item create` has the subcommands `login`, `note`, `credit-card`, `wifi`, `custom`, `identity`, `ssh-key`; check
  `pass-cli item create <type> --help` for the fields of each.
- `item update --field` puts the value in the command line, where it shows up in `ps`. Do not use it for secret
  values; ask the human to update the secret in the Proton Pass app.

## Requires explicit human confirmation every time

Show the exact command and target and wait for a "yes". These destroy data, move it or change who can see it.

| Command | Effect |
|---|---|
| `pass-cli item delete --share-id <ID> --item-id <ID>` | Deletes permanently |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli item trash --vault-name <V> --item-title <T>` | Moves to trash |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli item untrash ...` | Restores from trash |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli item move --from-vault-name <V> --item-title <T> --to-vault-name <V2>` | Moves to another vault |
| `pass-cli item share --share-id <ID> --item-id <ID> <email>` | Shares an item with someone |
| `PROTON_PASS_AGENT_REASON="<why>" pass-cli vault update --vault-name <V> --name <NEW>` | Renames a vault |
| `pass-cli item member ...` | Changes who can access an item |
| `pass-cli vault delete --vault-name <V>` | Deletes a vault and its items |
| `pass-cli vault share ...`, `pass-cli vault member ...`, `pass-cli vault transfer ...` | Vault sharing, membership and ownership |
| `pass-cli invite accept\|reject ...` | Accepts or rejects a pending invite |
| `pass-cli agent create\|delete\|renew\|access ...` | Agent management: belongs to the human |
| `pass-cli personal-access-token ...` | PAT management: belongs to the human |

`agent renew` invalidates the current token immediately: running it from the agent breaks its own session.

## Session

| Command | Purpose |
|---|---|
| `pass-cli login` | Log in with `PROTON_PASS_PERSONAL_ACCESS_TOKEN` from the environment |
| `pass-cli logout` | End the session |
| `pass-cli logout --force` | End the session even if the remote logout fails |
| `pass-cli agent instructions` | Print Proton's agent instructions (needs a session) |

Not available in 2.4.2: `pass-cli test` (use `pass-cli info`), `item view --item-name` (use `--item-title`).
