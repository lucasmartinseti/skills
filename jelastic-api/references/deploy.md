# Deploy & VCS

**Classes:** `environment.Deployment` (21 métodos), `environment.Vcs` (5 métodos), `environment.Build` (11 métodos)  
**Docs completos:** Memory → `notes/jelastic-api-environment`

---

## Deploy via URL / Upload

### DeployHostingApp — Deploy de WAR/JAR/ZIP via URL

```
POST /1.0/environment/deployment/rest/deployhostingapp
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeGroup` | Sim | Grupo alvo (`cp`) |
| `fileUrl` | Não* | URL do arquivo a fazer deploy |
| `fileName` | Sim | Nome do arquivo |
| `context` | Não | Context path (`ROOT`, `myapp`, etc.) |

*Alternativa: usar `fileId` para arquivo já no armazenamento.

### GetDeployments — Listar deploys

```
GET /1.0/environment/deployment/rest/getdeployments
```
`session`, `envName`, `nodeGroup`

### UndeployApp — Remover aplicação

```
POST /1.0/environment/deployment/rest/undeployapp
```
`session`, `envName`, `nodeGroup`, `context`

### RenameApp — Renomear contexto

```
POST /1.0/environment/deployment/rest/renameapp
```
`session`, `envName`, `nodeGroup`, `oldContext`, `newContext`

### GetHooks — Listar hooks de deploy

```
GET /1.0/environment/deployment/rest/gethooks
```
`session`, `envName`, `nodeGroup`

### AddHook / EditHook / DeleteHook — Hooks pré/pós deploy

```
POST /1.0/environment/deployment/rest/addhook
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeGroup` | Sim | Grupo alvo |
| `event` | Sim | `PRE_DEPLOY` ou `POST_DEPLOY` |
| `script` | Sim | Script bash a executar |

---

## Deploy via VCS (Git / SVN)

### AddProject — Registrar repositório VCS

```
POST /1.0/environment/vcs/rest/addproject
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeGroup` | Sim | Grupo alvo (`cp`) |
| `type` | Sim | `GIT` ou `SVN` |
| `name` | Sim | Alias do projeto no Jelastic |
| `url` | Sim | URL do repositório |
| `branch` | Não | Branch Git (default `main`) |
| `login` | Não | Usuário VCS (para repos privados) |
| `password` | Não | Senha ou token VCS |
| `context` | Não | Context path de deploy |
| `autoUpdate` | Não | `true`/`false` — deploy automático |
| `interval` | Não | Intervalo em minutos para auto-update |

### AddProjectWithKey — Repo privado com SSH key

```
POST /1.0/environment/vcs/rest/addprojectwithkey
```
Mesmo que `AddProject` + `keyId` (ID da SSH key cadastrada).

### Update — Fazer deploy do VCS

```
POST /1.0/environment/vcs/rest/update
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeGroup` | Sim | Grupo alvo |
| `name` | Sim | Alias do projeto cadastrado |

### GetProjects — Listar projetos VCS

```
GET /1.0/environment/vcs/rest/getprojects
```
`session`, `envName`, `nodeGroup`

### RemoveProject

```
POST /1.0/environment/vcs/rest/removeproject
```
`session`, `envName`, `nodeGroup`, `name`

---

## Build (Maven/Gradle)

### BuildProject — Build sem deploy

```
POST /1.0/environment/build/rest/buildproject
```
`session`, `envName`, `nodeid`, `projectName`

### BuildDeployProject — Build + deploy em seguida

```
POST /1.0/environment/build/rest/builddeployproject
```
`session`, `envName`, `nodeid`, `projectName`, `deployEnvName`, `deployNodeGroup`, `context`

### GetProjects — Listar projetos de build

```
GET /1.0/environment/build/rest/getprojects
```
`session`, `envName`

### AddProject / EditProject / RemoveProject

```
POST /1.0/environment/build/rest/addproject
POST /1.0/environment/build/rest/editproject
POST /1.0/environment/build/rest/removeproject
```
