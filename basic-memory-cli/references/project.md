# Project Management

## List and inspect

```bash
bm project list
bm project list --json
bm project list --workspace my-workspace
bm project info main
bm project info main --json
```

## Add projects

```bash
# Local project
bm project add research ~/Documents/research

# Cloud project (no local sync)
bm project add research --cloud

# Cloud project with local sync path
bm project add research --cloud --local-path ~/docs

# Add and set default
bm project add research ~/Documents/research --default
```

Flags:
- `--local-path`: local sync path for cloud mode
- `--default`: set as default project
- `--local` / `--cloud`: force routing mode

## Remove and defaults

```bash
bm project remove research
bm project remove research --delete-notes
bm project default main
```

Warning: `--delete-notes` also deletes project files from disk.

## Move and list files

```bash
bm project move research /new/path/to/research
bm project ls --name research
bm project ls --name research subfolder
bm project ls --name research --local
bm project ls --name research --cloud
```

`bm project ls` requires `--name`.

## Per-project routing mode

```bash
bm project set-cloud research
bm project set-local research
```
