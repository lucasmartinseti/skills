# Artifacts, Keys, Cache & Completion

## Artifacts (Downloads)

```bash
# List artifacts for current repo
bb artifact list
bb artifact list --repository myworkspace/myrepo

# Upload (one file at a time; artifact name = filename)
bb artifact upload myartifact.zip
bb artifact upload myartifact.zip --progress   # show progress bar

# Download
bb artifact download myartifact.zip
bb artifact download myartifact.zip --destination ./downloads/
bb artifact download myartifact.zip --progress

# Delete (supports multiple args)
bb artifact delete myartifact.zip
bb artifact delete artifact1.zip artifact2.zip
```

## GPG Keys

```bash
# List GPG keys (current user by default)
bb gpg-key list
bb gpg-key list --user {userUUID}

# Get key details
bb gpg-key get <fingerprint>

# Create a GPG key
bb gpg-key create \
  --name    "My Key" \
  --key     "-----BEGIN PGP PUBLIC KEY BLOCK-----..."
# Or from file:
bb gpg-key create --key-file /path/to/key.asc
# Or from stdin:
bb gpg-key create --key-file -

# Delete
bb gpg-key delete <fingerprint>
```

## SSH Keys

```bash
# List SSH keys (current user by default)
bb ssh-key list
bb ssh-key list --user {userUUID}

# Get key details
bb ssh-key get <fingerprint>

# Create an SSH key
bb ssh-key create \
  --name "My SSH Key" \
  --key  "ssh-ed25519 AAAA..."
# Or from file:
bb ssh-key create --key-file ~/.ssh/id_ed25519.pub
# Or from stdin:
bb ssh-key create --key-file -

# Delete
bb ssh-key delete <fingerprint>
```

## Cache

`bb` caches workspaces, projects, and users for 5 minutes by default.

```bash
# Clear the cache
bb cache clear
```

Override cache duration: `BITBUCKET_CLI_CACHE_DURATION=10m`
Encrypt cache files: `BITBUCKET_CLI_CACHE_ENCRYPTIONKEY=<aes256-key>`

## Shell Completion

```bash
# Bash
source <(bb completion bash)
# Persist:
bb completion bash >> ~/.bashrc

# Zsh
source <(bb completion zsh)
# Persist:
bb completion zsh > "${fpath[1]}/_bb"
# macOS with Homebrew:
bb completion zsh > "$(brew --prefix)/share/zsh/site-functions/_bb"

# Fish
bb completion fish | source
# Persist:
bb completion fish > ~/.config/fish/completions/bb.fish

# PowerShell
bb completion powershell | Out-String | Invoke-Expression
```
