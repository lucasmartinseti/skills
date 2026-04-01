# Schema Commands

Schema commands help define, validate, and evolve note structure.

## validate

```bash
bm schema validate
bm schema validate person
bm schema validate people/ada-lovelace.md
bm schema validate person --strict
bm schema validate person --json
bm schema validate person --project research
```

Flags:
- `--strict`: treat warnings as errors (exit code 1 on any issue)
- `--json`: machine-readable output
- `--project`: target project
- `--local` / `--cloud`: force routing mode

## infer

```bash
bm schema infer person
bm schema infer person --threshold 0.1
bm schema infer person --save
bm schema infer person --json
bm schema infer person --project research
```

Flags:
- `--threshold`: minimum frequency for field inclusion (default `0.25`)
- `--save`: save inferred schema note in `schemas/`
- `--json`: machine-readable output
- `--project`: target project
- `--local` / `--cloud`: force routing mode

## diff

```bash
bm schema diff person
bm schema diff person --json
bm schema diff person --project research
```

Compares schema definition against actual note usage to detect drift.
