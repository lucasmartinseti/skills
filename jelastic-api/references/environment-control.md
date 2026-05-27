# Environment Control

**Classe:** `environment.Control` (91 métodos)  
**Docs completos:** Memory → `notes/jelastic-api-environment`

Os métodos mais usados estão listados abaixo. Para a lista completa dos 91 métodos, consulte o Memory vault.

---

## Ambientes — CRUD

### GetEnvs — Listar todos os ambientes

```
GET /1.0/environment/control/rest/getenvs
```
`session`, `appid`

**Status:** `1`=running, `2`=stopped, `3`=sleeping, `6`=creating, `7`=cloning.

### GetEnvInfo — Detalhes de um ambiente

```
GET /1.0/environment/control/rest/getenvinfo
```
`session`, `envName`

Retorna nós, domínios, SSL, variáveis de ambiente, status.

### CreateEnvironment

```
POST /1.0/environment/control/rest/createenvironment
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `env` | Sim | JSON com `shortdomain`, `engine` |
| `nodes` | Sim | JSON array com `nodeType`, `fixedCloudlets`, `flexibleCloudlets` |

**Exemplo `env`:** `{"shortdomain":"myapp","engine":"java8"}`  
**Exemplo `nodes`:** `[{"nodeType":"tomcat9","fixedCloudlets":2,"flexibleCloudlets":4,"nodeGroup":"cp"}]`

**nodeType comuns:** `tomcat9`, `tomcat10`, `nginx`, `apache`, `nodejs`, `python3`, `php8`, `mysql8`, `postgres15`, `redis`, `mongodb`.

### DeleteEnv

```
POST /1.0/environment/control/rest/deleteenv
```
`session`, `envName`, `password`

### CloneEnv

```
POST /1.0/environment/control/rest/cloneenv
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `srcEnvName` | Sim | Ambiente de origem |
| `dstEnvName` | Sim | Nome do clone |

---

## Ciclo de vida

### StartEnv / StopEnv / SleepEnv

```
GET /1.0/environment/control/rest/startenv
GET /1.0/environment/control/rest/stopenv
GET /1.0/environment/control/rest/sleepenv
```
`session`, `envName`

### RestartNodes — Reiniciar nós de um grupo

```
POST /1.0/environment/control/rest/restartnodes
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeGroup` | Não | `cp`, `bl`, `sqldb`, etc. |
| `nodeid` | Não | ID específico do nó |

### SetEnvDisplayName

```
POST /1.0/environment/control/rest/setenvdisplayname
```
`session`, `envName`, `displayName`

---

## Topologia & Scaling

### ChangeTopology — Reconfigurar nós do ambiente

```
POST /1.0/environment/control/rest/changetopology
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `envName` | Sim | Nome do ambiente |
| `env` | Sim | JSON com configurações gerais |
| `nodes` | Sim | JSON array com nova topologia de nós |

### SetCloudletsCountById — Escalar cloudlets de um nó

```
POST /1.0/environment/control/rest/setcloudletscountbyid
```
`session`, `envName`, `nodeid`, `fixedCloudlets`, `flexibleCloudlets`

### GetNodeGroups — Listar grupos de nós

```
GET /1.0/environment/control/rest/getnodegroups
```
`session`, `envName`

---

## Variáveis de Ambiente

### GetContainerEnvVars

```
GET /1.0/environment/control/rest/getcontainerenvvars
```
`session`, `envName`, `nodeId`

### SetContainerEnvVars

```
POST /1.0/environment/control/rest/setcontainerenvvars
```
`session`, `envName`, `nodeId`, `vars` (JSON object)

### AddContainerEnvVars

```
POST /1.0/environment/control/rest/addcontainerenvvars
```
`session`, `envName`, `nodeGroup` ou `nodeid`, `vars` (JSON object)

### RemoveContainerEnvVars

```
POST /1.0/environment/control/rest/removecontainerenvvars
```
`session`, `envName`, `nodeGroup` ou `nodeid`, `vars` (JSON array de nomes)

---

## Execução de Comandos

### ExecCmdById — Executar comando em nó específico

```
POST /1.0/environment/control/rest/execcmdbyid
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `commands` | Sim | JSON array: `[{"command":"cmd","params":""}]` |

### ExecCmdByGroup — Executar em todos os nós de um grupo

```
POST /1.0/environment/control/rest/execcmdbygroup
```
`session`, `envName`, `nodeGroup`, `commands` (JSON array)

---

## Logs

### GetLogsList — Listar arquivos de log

```
GET /1.0/environment/control/rest/getlogslist
```
`session`, `envName`, `nodeid`

### ReadLog — Ler conteúdo de um log

```
GET /1.0/environment/control/rest/readlog
```
`session`, `envName`, `nodeid`, `path`

### GetLogs — Stream de logs com filtro

```
GET /1.0/environment/control/rest/getlogs
```
`session`, `envName`, `nodeid`, `path`, `[lines]`, `[startRow]`

---

## Estatísticas

### GetStats — CPU/RAM/Disco/Tráfego

```
GET /1.0/environment/control/rest/getstats
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `duration` | Sim | Período em segundos |
| `interval` | Sim | Intervalo de amostragem em segundos |
| `nodeid` | Não | ID específico do nó |
| `nodeGroup` | Não | Grupo de nós |

---

## Redeploy de Containers

### RedeployContainersByGroup

```
POST /1.0/environment/control/rest/redeploycontainersbygroup
```
`session`, `envName`, `nodeGroup`, `tag`, `[useExistingVolumes]`

### RedeployContainerById

```
POST /1.0/environment/control/rest/redeploycontainerbyid
```
`session`, `envName`, `nodeid`, `tag`

---

## Migrações

### CheckMigrationPossibility

```
GET /1.0/environment/control/rest/checkmigrationpossibility
```
`session`, `envName`, `hardwareNodeGroup`

### Migrate

```
POST /1.0/environment/control/rest/migrate
```
`session`, `appid`, `envName`, `hardwareNodeGroup`, `[isOnline]`

---

## Outros úteis

| Método | Endpoint | Uso |
|--------|----------|-----|
| `GetRegions` | `/rest/getregions` | Lista regiões disponíveis |
| `GetTemplates` | `/rest/gettemplates` | Lista node types disponíveis |
| `GetSSHAccessInfo` | `/rest/getsshAccessInfo` | Info de acesso SSH ao nó |
| `ResetNodePasswordById` | `/rest/resetnodepasswordbyid` | Reset senha de nó |
| `GetContainerTags` | `/rest/getcontainertags` | Tags Docker disponíveis |
| `AddEndpoint` | `/rest/addendpoint` | Mapeamento de porta externa |
| `GetEndpoints` | `/rest/getendpoints` | Lista mapeamentos de porta |
