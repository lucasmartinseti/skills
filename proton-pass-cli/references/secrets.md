# Secrets: references, run, inject and item view

## Secret references

```text
pass://<vault>/<item>/<field>
```

- `<vault>`: vault name or Share ID. `<item>`: item title or Item ID. `<field>`: field name. All three are
  required; `pass://vault/item` and trailing slashes are invalid.
- Names may contain spaces (`pass://My Vault/My Item/password`).
- If several vaults or items share a name, the CLI uses the first match. Use IDs
  (`pass://<SHARE_ID>/<ITEM_ID>/<field>`) when the target must be unique; get them from `--output json` listings.
- Common login fields: `username`, `password`, `email`, `url`, `note`, `totp`. Custom fields use their own name.
- Fields inside named sections (custom, SSH key, Wi-Fi items) can be qualified: `pass://Work/Deploy/Staging.password`.
  Without the prefix, the first matching field across sections is used.
- TOTP fields resolve to the current code. `?totp=uri` returns the raw `otpauth://` URI instead; do not request
  the URI unless the human asked to migrate the seed.

## `pass-cli run` (preferred)

Resolves `pass://` references found in environment variables and in `--env-file` files, then runs the command
with the real values. Secret values in the child's stdout/stderr are replaced by `<concealed by Proton Pass>`.

```bash
export API_KEY='pass://<Vault>/<Item>/api_key'
PROTON_PASS_AGENT_REASON="Call the billing API for the report the user asked for" pass-cli run -- ./report.sh

PROTON_PASS_AGENT_REASON="Start the app locally with staging credentials" \
  pass-cli run --env-file .env.staging -- npm run dev
```

- References can be mixed with text: `DATABASE_URL="postgresql://app:pass://<Vault>/DB/password@localhost/app"`.
- Later `--env-file` files override earlier ones.
- `run` forwards stdin/stdout/stderr but is not a full TTY. For interactive programs, ask the human how to proceed
  instead of exporting the value into the shell.
- Keep `.env` files with `pass://` references out of version control unless the project already versions them
  (references are not secrets, but they reveal vault and item names).
- Never add `--no-masking`.

## `pass-cli inject`

Renders a template. Only references wrapped in double braces are replaced; bare `pass://` text is left as is.

```text
# config.yaml.tpl
database:
  username: {{ pass://<Vault>/<Item>/username }}
  password: {{ pass://<Vault>/<Item>/password }}
```

```bash
PROTON_PASS_AGENT_REASON="Render the database config for the local test run" \
  pass-cli inject --in-file config.yaml.tpl --out-file config.yaml
```

- Always use `--out-file`: without it the rendered secrets go to stdout, i.e. into the agent's output.
- The output file gets mode `0600` by default. Do not pass a wider `--file-mode`.
- If the output file already exists, `inject` prompts for confirmation, which blocks a non-interactive agent. Write
  to a new path; `--force` (overwrite without prompting) only on a file the agent itself created in this task.
- Make sure the output path is ignored by git (`git check-ignore <file>`) and delete the file when the task ends.

## `pass-cli item view`

Use only when the agent itself must read the value. Ask for a single field, not the whole item.

```bash
PROTON_PASS_AGENT_REASON="Fill the login form of the vendor portal the user asked to check" \
  pass-cli item view --vault-name "<Vault>" --item-title "<Item>" --field username

PROTON_PASS_AGENT_REASON="Fill the login form of the vendor portal the user asked to check" \
  pass-cli item view "pass://<Vault>/<Item>/password"
```

- Without `--field` (or a field in the URI) the command prints every field of the item. Avoid it; to learn which
  fields exist, use `item list --output json` metadata or ask the human.
- Do not repeat the value in the chat, notes or commit messages. If the value must go into another command,
  prefer `pass-cli run` with a reference.

## Writing a good reason

`PROTON_PASS_AGENT_REASON` is stored encrypted in the agent's audit log (`pass-cli agent monitor`). Make it answer
"why does the agent need this item now":

- Good: `Deploy the staging worker requested in GL-ISSUE-42`
- Bad: `need password`, `task`, an empty string, or anything containing the secret itself
- Maximum 300 characters.
