---
name: jelastic-api
description: Interact with Jelastic (Virtuozzo Application Platform) via REST API v8.10.1. Use this skill whenever the user wants to manage Jelastic environments, deploy applications, scale nodes, manage files, configure SSL/domains, or automate any Jelastic platform operation from the command line. Trigger even when the user just mentions "Jelastic", "Virtuozzo", "PaaS environment", "jcloud", or asks to create/start/stop/clone environments, deploy apps, or check environment status — any Jelastic operation counts.
---

# Jelastic API Skill

Automate Jelastic (Virtuozzo Application Platform) operations via its REST API. All actions that are available through the dashboard can be performed programmatically — creating environments, deploying apps, scaling nodes, managing files, configuring SSL, and more.

**API base URL:** `https://[hoster-api-host]/1.0/`  
**Full docs (336 methods):** Memory vault → `projects/chagbrasil/skills/notes/jelastic-api-*`  
**Official docs:** https://docs.jelastic.com/api/8.10.1/public/#!/api

---

## Reference Guides

Load the relevant reference when working on a specific area:

| Area | File | When to load |
|------|------|-------------|
| Authentication & Tokens | `references/authentication.md` | Signin, Signout, PAT management |
| Environment Control | `references/environment-control.md` | Create, start, stop, clone, delete environments |
| Deploy & VCS | `references/deploy.md` | Deploy apps, VCS hooks, build |
| Files & Logs | `references/files-logs.md` | File manager, node logs, statistics |
| SSL & Domains | `references/ssl-domains.md` | Custom domains, SSL certificates, IPs |
| Marketplace & JPS | `references/marketplace.md` | Install apps, run JPS scripts |
| Billing | `references/billing.md` | Quotas, billing history, subscriptions |

---

## Authentication

Every API call requires a `session` parameter. There are two ways to authenticate:

### Option 1 — Personal Access Token (PAT) (recommended)

Use the PAT directly as the `session` value. No login/logout needed.  
Create at: Dashboard → Account → Access Tokens  
Docs: https://www.virtuozzo.com/application-platform-docs/personal-access-tokens/

```bash
# Store as env var — never hardcode
export JELASTIC_TOKEN="your-pat-here"
export JELASTIC_HOST="app.jelastic.example.com"
export JELASTIC_APPID="dashboard"
```

### Option 2 — Session Token (login/logout)

```bash
# Signin (POST required for password)
SESSION=$(curl -s -X POST \
  "https://$JELASTIC_HOST/1.0/users/authentication/rest/signin" \
  -d "login=user@email.com&password=SECRET&appid=$JELASTIC_APPID" \
  | jq -r '.session')

# ... run your operations ...

# Signout when done
curl -s "https://$JELASTIC_HOST/1.0/users/authentication/rest/signout" \
  -d "session=$SESSION&appid=$JELASTIC_APPID"
```

> Use POST (not GET) for Signin and any method that takes a password — this is a security requirement of the API.

---

## Making API Calls

All calls follow the same pattern:

```
GET or POST https://[host]/1.0/[category]/[class]/rest/[method]
  ?param1=value1&param2=value2
```

The `appid` parameter defaults to `dashboard` for account-level operations. For environment-specific operations, use `envName` instead.

### Minimal helper function (bash)

```bash
jelastic() {
  local method="$1"; shift
  curl -s "https://$JELASTIC_HOST/1.0/$method" \
    --data-urlencode "session=$JELASTIC_TOKEN" \
    --data-urlencode "appid=$JELASTIC_APPID" \
    "$@"
}

# Usage
jelastic "environment/control/rest/getenvs" | jq '.infos[].env.envName'
```

### Checking results

Every response includes `result: 0` on success, or a non-zero code on error:

```bash
response=$(jelastic "environment/control/rest/getenvs")
result=$(echo "$response" | jq -r '.result')
if [ "$result" != "0" ]; then
  echo "Error: $(echo "$response" | jq -r '.error')"
fi
```

---

## Key Workflows

### List all environments

```bash
curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/getenvs" \
  -d "session=$JELASTIC_TOKEN&appid=$JELASTIC_APPID" \
  | jq '.infos[] | {name: .env.envName, status: .env.status}'
```

Environment status codes: `1`=running, `2`=stopped, `3`=sleeping, `6`=creating, `7`=cloning.

### Create an environment

```bash
curl -s -X POST "https://$JELASTIC_HOST/1.0/environment/control/rest/createenvironment" \
  -d "session=$JELASTIC_TOKEN&appid=$JELASTIC_APPID" \
  --data-urlencode 'env={"shortdomain":"myapp","engine":"java8"}' \
  --data-urlencode 'nodes=[{"nodeType":"tomcat9","fixedCloudlets":2,"flexibleCloudlets":4}]'
```

### Start / Stop / Restart an environment

```bash
# Start
curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/startenv" \
  -d "session=$JELASTIC_TOKEN&envName=myapp"

# Stop
curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/stopenv" \
  -d "session=$JELASTIC_TOKEN&envName=myapp"

# Restart all nodes
curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/restartenvs" \
  -d "session=$JELASTIC_TOKEN&envName=myapp"
```

### Clone an environment

```bash
curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/cloneenv" \
  -d "session=$JELASTIC_TOKEN&appid=$JELASTIC_APPID&srcEnvName=myapp&dstEnvName=myapp-staging"
```

### Deploy an application (via URL)

```bash
curl -s -X POST "https://$JELASTIC_HOST/1.0/environment/deployment/rest/deployhostingapp" \
  -d "session=$JELASTIC_TOKEN&envName=myapp&nodeGroup=cp" \
  --data-urlencode "fileUrl=https://repo.example.com/app.war" \
  -d "fileName=app.war&context=ROOT"
```

### Deploy via VCS (Git)

```bash
# Add VCS project
curl -s -X POST "https://$JELASTIC_HOST/1.0/environment/vcs/rest/addproject" \
  -d "session=$JELASTIC_TOKEN&envName=myapp&nodeGroup=cp" \
  --data-urlencode "url=https://github.com/org/repo.git" \
  -d "name=myrepo&branch=main"

# Deploy
curl -s "https://$JELASTIC_HOST/1.0/environment/vcs/rest/update" \
  -d "session=$JELASTIC_TOKEN&envName=myapp&nodeGroup=cp&name=myrepo"
```

### Scale nodes (horizontal)

```bash
curl -s -X POST "https://$JELASTIC_HOST/1.0/environment/control/rest/setnodecount" \
  -d "session=$JELASTIC_TOKEN&envName=myapp&nodeGroup=cp&count=3"
```

### Read a file from a node

```bash
# Get nodeId first
NODE_ID=$(curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/getenvinfo" \
  -d "session=$JELASTIC_TOKEN&envName=myapp" \
  | jq -r '.nodes[] | select(.nodeGroup=="cp") | .id' | head -1)

# Read file
curl -s "https://$JELASTIC_HOST/1.0/environment/file/rest/read" \
  -d "session=$JELASTIC_TOKEN&envName=myapp&nodeid=$NODE_ID" \
  --data-urlencode "path=/var/log/tomcat/catalina.out" \
  | jq -r '.body'
```

### Execute a command on a node

```bash
curl -s -X POST "https://$JELASTIC_HOST/1.0/environment/control/rest/execcmdbyid" \
  -d "session=$JELASTIC_TOKEN&envName=myapp&nodeid=$NODE_ID" \
  --data-urlencode 'commands=[{"command":"ls -la /opt/tomcat/webapps","params":""}]'
```

### Run a JPS script (Cloud Scripting / Marketplace)

```bash
curl -s -X POST "https://$JELASTIC_HOST/1.0/marketplace/jps/rest/install" \
  -d "session=$JELASTIC_TOKEN&appid=$JELASTIC_APPID" \
  --data-urlencode 'manifest={"type":"update","name":"My Script","onInstall":{"execCmd":{"nodeGroup":"cp","commands":"echo hello"}}}' \
  -d "envName=myapp"
```

---

## Environment Info & Monitoring

```bash
# Full environment info (nodes, domains, SSL, etc.)
curl -s "https://$JELASTIC_HOST/1.0/environment/control/rest/getenvinfo" \
  -d "session=$JELASTIC_TOKEN&envName=myapp"

# Action history / audit
curl -s "https://$JELASTIC_HOST/1.0/environment/tracking/rest/getactions" \
  -d "session=$JELASTIC_HOST&envName=myapp"

# Account quotas
curl -s "https://$JELASTIC_HOST/1.0/billing/account/rest/getquotas" \
  -d "session=$JELASTIC_TOKEN&appid=$JELASTIC_APPID"
```

---

## Common Parameters Reference

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `session` | PAT ou token de sessão | `abc123...` |
| `appid` | ID da conta/app | `dashboard` |
| `envName` | Nome do ambiente alvo | `myapp` |
| `nodeGroup` | Grupo de nós | `cp`, `bl`, `sqldb`, `storage` |
| `nodeid` | ID numérico do nó | `12345` |

**nodeGroup values:** `cp` (app server), `bl` (load balancer), `sqldb` (SQL DB), `nosqldb` (NoSQL DB), `storage` (storage), `vps`, `build`, `cache`.

---

## Security Notes

- Store `JELASTIC_TOKEN` in environment variables or a secrets manager — never hardcode.
- Prefer PATs over session tokens for automation: scoped permissions, no expiry risk mid-script.
- PATs with `POST`-only Signin restriction are the safest option for CI/CD.
- Use `signout` at the end of scripts that use session tokens to avoid orphaned sessions.
