# Session: login, isolation, expiry and recovery

## How the agent gets its token

The human creates the agent and grants access (these commands are the human's, not the agent's):

```bash
pass-cli agent create <agent-name> --expiration 1m --vault "<Vault>"
pass-cli agent access grant <agent-name> --vault-name "<Vault>" --item-title "<Item>" --role viewer
```

`agent create` prints JSON with a `token` field (`PROTON_PASS_PERSONAL_ACCESS_TOKEN=pst_<64 chars>::<key>`) and an
`instruction` field. The token is shown only once.

The token must reach the agent's environment without passing through files the agent writes, notes or the
chat. Options, safest first:

| Source | How the human provides it | Login command the agent runs |
|---|---|---|
| Already exported | `export PROTON_PASS_PERSONAL_ACCESS_TOKEN=...` in the shell that starts the agent | `pass-cli login` |
| macOS Keychain | `security add-generic-password -s pass-cli-agent -a "$USER" -w` (prompts for the value) | `PROTON_PASS_PERSONAL_ACCESS_TOKEN="$(security find-generic-password -s pass-cli-agent -w)" pass-cli login` |
| Linux secret service | `secret-tool store --label=pass-cli-agent service pass-cli-agent` | `PROTON_PASS_PERSONAL_ACCESS_TOKEN="$(secret-tool lookup service pass-cli-agent)" pass-cli login` |

Do not use `pass-cli login --pat <TOKEN>`: the token would show up in the process list. Do not `echo` the token
or the variable.

If none of the sources is available, stop and ask the human to set one up. Never ask for the token in the chat.

## Isolated session directory

`PROTON_PASS_SESSION_DIR` points the CLI to its own session store. Use one directory per agent so the agent never
reads or overwrites the human's session.

```bash
export PROTON_PASS_SESSION_DIR="${TMPDIR:-/tmp}/pass-agent-<agent-name>"
mkdir -p -m 700 "$PROTON_PASS_SESSION_DIR" && [ -O "$PROTON_PASS_SESSION_DIR" ] && chmod 700 "$PROTON_PASS_SESSION_DIR"
```

- `${TMPDIR}` is per-user on macOS; `/tmp` is shared on Linux. The `[ -O ... ]` test fails if another user
  created the directory first: in that case pick another name and report it.
- `pass-cli` 2.4.2 creates a missing session directory with mode `0700` by itself; the `mkdir` above covers the
  case where the directory already exists.
- Export the variable in every shell that runs `pass-cli`. A shell without it uses the default session store.

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
| Malformed token | `Personal access token token must have exactly 64 characters after 'pst_' prefix` | 1 |
| `logout --force` without a session | `Successfully performed force logout` | 0 |
| `pass-cli agent instructions` without a session | `Error: This operation requires an authenticated client` | 1 |
| `pass-cli login` without `PROTON_PASS_PERSONAL_ACCESS_TOKEN` | `Please open the following URL in your browser...` and blocks waiting | — |

The `ERROR pass-cli/src/main.rs:...` line before the message is the CLI's own log; the `Error:` line is the cause.

## Recovery

On an authentication error or an unexpected non-zero exit:

1. Read the full output (stdout and stderr) and the exit code.
2. If it is not an authentication problem (wrong vault/item name, missing field, bad flag), fix the command
   instead of logging in again.
3. If it is authentication:

```bash
pass-cli logout --force
[ -n "${PROTON_PASS_PERSONAL_ACCESS_TOKEN:-}" ] && pass-cli login
pass-cli info
```

4. Retry the original command once. If it fails again, stop and report the error to the human. Likely causes: the
   token expired (`--expiration` reached), was renewed (`agent renew` invalidates the old token) or deleted.

## Ending the session

At the end of the task, log out so the session directory holds no usable session:

```bash
pass-cli logout
```

Use `pass-cli logout --force` if the regular logout fails (for example, when the API is unreachable).
