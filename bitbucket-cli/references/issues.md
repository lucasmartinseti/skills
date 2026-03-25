# Issues

## List & Get

```bash
# List issues (open + new by default)
bb issue list

# Filter by state (can repeat flag or comma-separate)
bb issue list --state open
bb issue list --state open --state new
bb issue list --state open,new,resolved,wontfix

# Get issue details
bb issue get 1
bb issue show 1
```

## Create, Update, Delete

```bash
# Create an issue
bb issue create \
  --title "Bug: something is broken" \
  --content "Detailed description"

# Update
bb issue update 1 \
  --title "Updated title" \
  --content "Updated description"

# Delete
bb issue delete 1
```

## Voting & Watching

```bash
bb issue vote 1
bb issue unvote 1
bb issue watch 1
bb issue unwatch 1
```

## Comments

```bash
# Add a comment
bb issue comment add --issue 1 --content "My comment"

# Get, update, delete
bb issue comment get    --issue 1 <comment-id>
bb issue comment update --issue 1 <comment-id> --content "Updated"
bb issue comment delete --issue 1 <comment-id>
```

## Attachments

```bash
# List attachments
bb issue attachment list --issue 1

# Upload (one file at a time)
bb issue attachment upload --issue 1 myfile.zip

# Download
bb issue attachment download --issue 1 myfile.zip

# Delete
bb issue attachment delete --issue 1 myfile.zip
```
