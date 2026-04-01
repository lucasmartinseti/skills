# Import Commands

```bash
bm import claude conversations
bm import chatgpt
bm import memory-json /path/to/export.json
```

## Notes

- Use imports to migrate conversation exports into Basic Memory.
- Prefer setting `default_project` or passing `--project` when routing matters.
- Most command groups support `--local` and `--cloud` to override routing.
