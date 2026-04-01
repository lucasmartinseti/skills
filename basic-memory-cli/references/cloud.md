# Cloud Commands

## Authentication and status

```bash
bm cloud login
bm cloud status
bm cloud logout
```

## API keys

```bash
bm cloud api-key save bmc_...
bm cloud api-key create "my-laptop"
```

`bm cloud api-key create` requires an active OAuth session. Run `bm cloud login` first.

## Setup and upload

```bash
bm cloud setup
bm cloud upload ~/my-notes --project research --create-project
```

## Sync operations

```bash
# One-way: local -> cloud
bm cloud sync

# Two-way: local <-> cloud
bm cloud bisync

# Verify integrity between local and cloud
bm cloud check

# Clear bisync state
bm cloud bisync-reset

# Configure local sync for existing cloud project
bm cloud sync-setup research ~/Documents/research
```

## Snapshots and restore

```bash
bm cloud snapshot create "Before migration"
bm cloud snapshot list
bm cloud snapshot show <snapshot-id>
bm cloud snapshot browse <snapshot-id>
bm cloud snapshot delete <snapshot-id>
bm cloud restore <path> --snapshot <snapshot-id>
```

## Workspaces and promo

```bash
bm cloud workspace list
bm cloud promo --off
bm cloud promo --on
```
