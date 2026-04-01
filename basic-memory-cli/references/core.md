# Core Commands

## status

```bash
bm status
bm status --verbose
bm status --json
bm status --project research
```

Flags:
- `--project`: target a specific project
- `--verbose`, `-v`: show detailed file information
- `--json`: machine-readable output
- `--local` / `--cloud`: force routing mode

## doctor

```bash
bm doctor
```

Runs local consistency checks between filesystem and database.

## mcp

```bash
bm mcp
bm mcp --project main
bm mcp --transport streamable-http --port 8000
bm mcp --transport sse
```

Flags:
- `--transport`: `stdio` (default), `streamable-http`, `sse`
- `--host`: host for HTTP transports (default `0.0.0.0`)
- `--port`: port for HTTP transports (default `8000`)
- `--path`: streamable-http path prefix (default `/mcp`)
- `--project`: lock MCP server to one project

## reindex

```bash
bm reindex
bm reindex --search
bm reindex --embeddings
bm reindex --project main
```

Flags:
- `--search`, `-s`: rebuild only full-text search index
- `--embeddings`, `-e`: rebuild only vector embeddings
- `--project`, `-p`: target one project

When no mode is given, both search and embeddings are rebuilt.

## reset

```bash
bm reset
bm reset --reindex
```

Drops and recreates database tables. Files are not deleted.

## format

```bash
bm format
bm format --project research
bm format notes/meeting.md
bm format notes/
```

Uses configured formatters (`formatter_command` or `formatters` config).
