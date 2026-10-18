# Session: login, isolation, expiry and recovery

## How the agent gets its token

The human creates the agent and grants access (these commands are the human's, not the agent's):

```bash
pass-cli agent create <agent-name> --expiration 1m --vault "<Vault>"
pass-cli agent access grant <agent-name> --vault-name "<Vault>" --item-title "<Item>" --role viewer
```

`agent create` prints JSON with a `token` field whose value is
`PROTON_PASS_PERSONAL_ACCESS_TOKEN=pst_<64 chars>::<key>`, plus an `instruction` field. The token is shown only
once. **Store only the `pst_...::<key>` part**: the whole string, with the variable name, fails validation
(`must have exactly 64 characters after 'pst_' prefix`).

The token must reach `pass-cli login` without passing through files the agent writes, notes or the chat. Sources
read by `pass_login` (SKILL.md, "Session setup"), safest first:

| Source | How the human stores it | Why |
|---|---|---|
| macOS Keychain | `security add-generic-password -U -s pass-cli-agent -a "$USER" -w` (prompts for the value) | Read only for the login command; never in the environment |
| Linux Secret Service | `secret-tool store --label=pass-cli-agent service pass-cli-agent` (prompts for the value) | Same |
| Environment variable | `export PROTON_PASS_PERSONAL_ACCESS_TOKEN=...` in the shell that starts the agent | Last resort: every process the agent starts inherits it and can read it (`env`, `ps eww`, `/proc/<pid>/environ`) |

- `-U` updates the keychain entry, so the same command works after `agent renew`.
- macOS may show a dialog asking to allow `security` to read the entry the first time. The human must click
  "Allow" (or "Always Allow"); until then the lookup returns nothing and `pass_login` asks for the human.
- With the environment variable, `pass_login` unsets it after login so the agent's child processes do not inherit
  it. A re-login after the 2-hour session then needs the human to export it again: prefer the keychain.

Do not use `pass-cli login --pat <TOKEN>`: the token would show up in the process list. Do not `echo` the token or
the variable. If no source is available, stop and ask the human to set one up. Never ask for the token in the chat.

## Isolated session directory

`PROTON_PASS_SESSION_DIR` points the CLI to its own session store. Use one directory per agent so the agent never
reads or overwrites the human's session, and export the variable only after checking the directory is yours:

```bash
D="${TMPDIR:-/tmp}/pass-agent-<agent-name>"
mkdir -p -m 700 "$D" && [ -d "$D" ] && [ ! -L "$D" ] && [ -O "$D" ] && chmod 700 "$D" \
  && export PROTON_PASS_SESSION_DIR="$D" \
  || { echo "unsafe session dir $D: stop and report" >&2; false; }
```

- Replace `<agent-name>` with the real agent name; copied literally, every agent would share one directory.
- `${TMPDIR}` is per-user on macOS; `/tmp` is shared on Linux. If another user (or a symlink) got to the path
  first, the check fails and the variable is not exported: stop and report, do not log in.
- `pass-cli` 2.4.2 creates a missing session directory with mode `0700` by itself; the check covers a directory
  that already exists.
- Export the variable in every shell that runs `pass-cli`. A shell without it uses the default session store, which
  may hold the human's own session.

## Checking the session

```bash
pass-cli info
pass-cli info --output json
```

Exit code `0` means there is a valid session; for a token session the output shows the token name instead of a
user e-mail. Agent and PAT sessions last 2 hours and cannot have a session lock.

## Errors seen in 2.4.2

| Situation | Output | Exit |
|---|---|---|
| No session (any command except `login`/`logout`) | `Error: This operation requires an authenticated client` | 1 |
| Malformed token (e.g. with the `PROTON_PASS_PERSONAL_ACCESS_TOKEN=` prefix) | `Personal access token token must have exactly 64 characters after 'pst_' prefix` | 1 |
| `logout --force` without a session | `Successfully performed force logout` | 0 |
| `pass-cli agent instructions` without a session | `Error: This operation requires an authenticated client` | 1 |
| `pass-cli login` with no token in the environment | `Please open the following URL in your browser...` and blocks waiting | — |

The `ERROR pass-cli/src/main.rs:...` line before the message is the CLI's own log; the `Error:` line is the cause.

## Recovery

On an authentication error or an unexpected non-zero exit:

1. Read the full output (stdout and stderr) and the exit code.
2. If it is not an authentication problem (wrong vault/item name, missing field, bad flag), fix the command
   instead of logging in again.
3. If it is authentication:

```bash
[ -n "${PROTON_PASS_SESSION_DIR:-}" ] && pass-cli logout --force   # never touch the default (human) session
pass_login && pass-cli info
```

4. Retry the original command once. If it fails again, stop and report the error to the human. Likely causes: the
   token expired (`--expiration` reached), was renewed (`agent renew` invalidates the old token) or deleted.

## Ending the session

At the end of the task, log out so the session directory holds no usable session:

```bash
[ -n "${PROTON_PASS_SESSION_DIR:-}" ] && pass-cli logout
```

Use `pass-cli logout --force` if the regular logout fails (for example, when the API is unreachable).
