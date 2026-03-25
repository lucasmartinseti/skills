# Pull Requests

`pullrequest` can be abbreviated as `pr` in most contexts.

## List & Get

```bash
# List open PRs (current repo)
bb pullrequest list
bb pr list

# Filter by state
bb pr list --state open
bb pr list --state all
bb pr list --state merged
bb pr list --state declined

# Filter by date
bb pr list --query 'updated_on > 2025-12-31'

# Output as JSON
bb pr list --output json

# Get PR details
bb pullrequest get 1
bb pullrequest show 1
```

## Create

```bash
# Basic PR
bb pullrequest create \
  --title "feat: my feature" \
  --source "feature/my-branch" \
  --destination "main"

# With description
bb pullrequest create \
  --title "feat: my feature" \
  --source "feature/my-branch" \
  --destination "main" \
  --description "Detailed description of the changes"

# With reviewers (pass username or {UUID}, repeat flag for multiple)
bb pullrequest create \
  --title "feat: my feature" \
  --source "feature/my-branch" \
  --destination "main" \
  --reviewer username1 \
  --reviewer {userUUID2}

# Use project default reviewers
bb pullrequest create \
  --title "feat: my feature" \
  --source "feature/my-branch" \
  --destination "main" \
  --reviewer default
```

## Update

```bash
# Update title and description
bb pullrequest update 1 \
  --title "Updated title" \
  --description "Updated description"

# Add/remove reviewers
bb pullrequest update 1 \
  --add-reviewer    username1 \
  --add-reviewer    {userUUID2} \
  --remove-reviewer username3
```

## Review Actions

```bash
# Approve / unapprove
bb pullrequest approve 1
bb pullrequest unapprove 1

# Decline
bb pullrequest decline 1

# Merge (auto-detects PR for current branch if no ID given)
bb pullrequest merge
bb pullrequest merge 1
```

## PR Comments

```bash
# List comments
bb pullrequest comment list --pullrequest 1

# Add a comment (optionally on a specific file and line)
bb pullrequest comment add --pullrequest 1 \
  --comment "My comment"

bb pullrequest comment add --pullrequest 1 \
  --comment "This line looks wrong" \
  --file    README.md \
  --line    42

# Get, update, delete a comment
bb pullrequest comment get    --pullrequest 1 <comment-id>
bb pullrequest comment update --pullrequest 1 <comment-id> --comment "Updated"
bb pullrequest comment delete --pullrequest 1 <comment-id>

# Resolve / re-open a comment
bb pullrequest comment resolve --pullrequest 1 <comment-id>
bb pullrequest comment reopen  --pullrequest 1 <comment-id>
```
