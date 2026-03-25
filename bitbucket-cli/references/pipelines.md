# Pipelines

## List & Get

```bash
# List pipelines (current repo by default)
bb pipeline list
bb pipeline list --repository myworkspace/myrepo

# Limit results (useful if list hangs on large histories)
bb pipeline list --limit 20

# Get pipeline details
bb pipeline get 123456
bb pipeline show 123456
```

## Trigger & Stop

```bash
# Trigger on current branch
bb pipeline trigger

# Trigger on a specific branch
bb pipeline trigger --branch main

# Trigger with variables
bb pipeline trigger --branch main \
  --variable KEY1=VALUE1 \
  --variable KEY2=VALUE2

# Trigger on a tag or commit instead of branch
bb pipeline trigger --tag v1.0.0
bb pipeline trigger --commit abc1234

# Stop a running pipeline
bb pipeline stop 123456
```

## Steps & Logs

```bash
# List steps of a pipeline
bb pipeline step list --pipeline 123456

# Get step details (UUID with or without {})
bb pipeline step get --pipeline 123456 {stepUUID}
bb pipeline step show --pipeline 123456 stepUUID

# Get step logs
bb pipeline step logs --pipeline 123456 {stepUUID}
```
