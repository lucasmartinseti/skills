# Tool Commands (`bm tool`)

`bm tool` is a CLI wrapper for MCP tools, useful for scripts and quick terminal operations.

## write-note

```bash
bm tool write-note --title "API Notes" --folder specs --content "# API Notes"
echo "# My Note" | bm tool write-note --title "My Note" --folder notes
```

## read-note

```bash
bm tool read-note "specs/api-notes"
bm tool read-note my-note --include-frontmatter
bm tool read-note my-note --page 2 --page-size 5
```

## edit-note

```bash
bm tool edit-note my-note --operation append --content "new content"
bm tool edit-note my-note --operation find_replace --find-text "old" --content "new"
bm tool edit-note my-note --operation replace_section --section "## Notes" --content "updated"
```

Important flags:
- `--operation`: `append`, `prepend`, `find_replace`, `replace_section`
- `--find-text`: required for `find_replace`
- `--section`: required for `replace_section`
- `--expected-replacements`: expected replacement count for `find_replace`

## search-notes

```bash
bm tool search-notes "authentication"
bm tool search-notes --tag python --tag async
bm tool search-notes --meta status=draft
bm tool search-notes --type person --type meeting
bm tool search-notes "how to speed up the app" --hybrid
bm tool search-notes "how to speed up the app" --vector
bm tool search-notes --permalink "specs/*"
bm tool search-notes --title "API Design"
bm tool search-notes --filter '{"priority": {"$in": ["high", "critical"]}}'
bm tool search-notes "api" --page 2 --page-size 20
```

Useful filters:
- `--hybrid` (keyword + semantic), `--vector` (semantic-only)
- `--tag`, `--status`, `--type`, `--entity-type`
- `--meta key=value`, `--filter <json>`
- `--after_date`, `--page`, `--page-size`

## context and activity

```bash
bm tool build-context memory://specs/search
bm tool build-context specs/search --depth 2 --timeframe 30d

bm tool recent-activity
bm tool recent-activity --timeframe 30d --page-size 20
bm tool recent-activity --type entity --type observation
```

## Schema wrappers

```bash
bm tool schema-validate --entity-type person
bm tool schema-infer person
bm tool schema-diff person
bm tool list-projects
bm tool list-workspaces
```

Most `bm tool` commands also support `--workspace`, `--project`, `--local`, and `--cloud`.
