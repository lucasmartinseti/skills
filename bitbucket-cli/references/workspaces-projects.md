# Workspaces & Projects

## Workspaces

```bash
# List all workspaces
bb workspace list
bb workspace list --membership   # show membership role

# Get workspace details
bb workspace get myworkspace
bb workspace get myworkspace --members         # list all members
bb workspace get myworkspace --member username # specific member

# Permissions
bb workspace permission get myworkspace         # your permission
bb workspace permission list myworkspace        # all user permissions
```

## Projects

```bash
# List projects (--workspace required unless profile has default)
bb project list --workspace myworkspace

# Get project details
bb project get myproject --workspace myworkspace

# Create project
bb project create \
  --name myproject \
  --key MYPROJECT \
  --workspace myworkspace

# Update project
bb project update myproject --name "New Name" --workspace myworkspace

# Delete project
bb project delete myproject --workspace myworkspace
```

## Project Default Reviewers

Default reviewers are automatically added to new pull requests in a project.

```bash
# List default reviewers
bb project reviewer list --workspace myworkspace --project myproject

# Add a default reviewer (UUID with or without {})
bb project reviewer add {userUUID} --workspace myworkspace --project myproject

# Remove a default reviewer
bb project reviewer remove {userUUID} --workspace myworkspace --project myproject

# Get reviewer details
bb project reviewer get --workspace myworkspace --project myproject {userUUID}
```

## Users

```bash
# Get your own user details
bb user me

# Get details of a specific user
bb user get {userUUID}
```
