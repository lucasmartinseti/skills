# Repositories

## List & Get

```bash
# List repos in a workspace
bb repo list --workspace myworkspace

# Filter options
bb repo list --workspace myworkspace \
  --role        owner \
  --project     myproject \
  --has-issues  true \
  --has-wiki    true \
  --is-private  false \
  --language    go \
  --main-branch master

# Get repo details
bb repo get --workspace myworkspace myrepository
```

## Clone

```bash
# Basic clone (uses profile default workspace)
bb repo clone myrepository

# Explicit workspace
bb repo clone myworkspace/myrepository
bb repo clone --workspace myworkspace myrepository

# With protocol
bb repo clone --protocol https myrepository
bb repo clone --protocol ssh myrepository
bb repo clone --protocol git myrepository

# Custom destination folder
bb repo clone --workspace myworkspace --destination myfolder myrepository

# SSH with custom key
bb repo clone --ssh-key /path/to/key myrepository

# HTTPS with username (for private repos)
bb repo clone --username myusername myrepository
```

Clone protocol resolution order: `--protocol` flag → profile `--clone-protocol` → default `git`.

## Create, Update, Delete

```bash
# Create
bb repo create myrepository_slug \
  --name      "My Repository" \
  --project   myproject \
  --workspace myworkspace

# Update
bb repo update --workspace myworkspace myrepository \
  --private \
  --fork-policy no_public_forks

# Delete (supports --dry-run)
bb repo delete --workspace myworkspace myrepository

# Delete multiple
bb repo delete myrepo1 myrepo2 myrepo3 --workspace myworkspace
```

## Fork

```bash
# Fork a repo
bb repo fork myrepository \
  --workspace myworkspace \
  --project   myproject \
  --name      myfork

# List forks of a repo
bb repo get myrepository --workspace myworkspace --forks
```
