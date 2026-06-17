# Marketplace & JPS (Cloud Scripting)

**Classes:** `marketplace.App` (10), `marketplace.Jps` (7), `marketplace.Installation` (6), `marketplace.Favorite` (4), `marketplace.Console` (3) — 30 métodos no total  
**Docs completos:** Memory → `notes/jelastic-api-marketplace` · https://docs.jelastic.com/api/8.15.1/public/#!/api

---

## JPS — Cloud Scripting

O JPS (Jelastic Packaging Standard) permite executar scripts de automação que provisionam, configuram e gerenciam ambientes de forma declarativa.

### Install — Executar manifesto JPS

```
POST /1.0/marketplace/jps/rest/install
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `jps` | Sim | Conteúdo do manifesto (JSON/YAML) **ou** URL para manifesto remoto |
| `envName` | Não | Ambiente alvo (se `type: update`) |
| `settings` | Não | JSON com variáveis do manifesto |
| `nodeGroup` | Não | Grupo de nós alvo |
| `displayName` | Não | Nome de exibição do ambiente |
| `region` | Não | Região de provisionamento |

> Na v8.15.1 o parâmetro é `jps` (aceita tanto o conteúdo inline quanto uma URL). Assinatura completa: `Install(appid, session, jps, [envName], [settings], [nodeGroup], [displayName], [region], [envGroups], [ownerUid], [logsPath], [loggerName], [writeOutputTasks], [skipNodeEmails], [auth])`.

**Exemplo — executar comando em todos os nós:**
```json
{
  "type": "update",
  "name": "Run command",
  "onInstall": {
    "execCmd": {
      "nodeGroup": "cp",
      "commands": "echo hello > /tmp/test.txt"
    }
  }
}
```

**Exemplo — criar novo ambiente via JPS:**
```json
{
  "type": "install",
  "name": "My App",
  "nodes": [
    { "nodeType": "nginx", "nodeGroup": "bl", "fixedCloudlets": 1 },
    { "nodeType": "tomcat9", "nodeGroup": "cp", "fixedCloudlets": 2, "flexibleCloudlets": 4 }
  ]
}
```

### GetEngineVersion — Versão do motor JPS

```
GET /1.0/marketplace/jps/rest/getengineversion
```
`session`, `appid`

### Outros métodos `marketplace.Jps` (v8.15.1)

```
GET  /1.0/marketplace/jps/rest/getappinfo        # GetAppInfo(appid, session, [jps], [lang], [ownerUid], [auth])
GET  /1.0/marketplace/jps/rest/getappsettings    # GetAppSettings(appid, session, appUniqueName, [settingsId], [lang])
POST /1.0/marketplace/jps/rest/executeappaction  # ExecuteAppAction(appid, session, appUniqueName, [action], [settingsId], [params], [lang])
GET  /1.0/marketplace/jps/rest/getscriptingappid # GetScriptingAppid(appid, session)
POST /1.0/marketplace/jps/rest/uninstall         # Uninstall(appid, session, appUniqueName, [force])
```

---

## Instalações (`marketplace.Installation`, 6 métodos)

### GetInfo — Informações de um app instalado

```
GET /1.0/marketplace/installation/rest/getinfo
```
`GetInfo(appid, session, appUniqueName)`

### Demais métodos

```
GET  /1.0/marketplace/installation/rest/getsettings     # GetSettings(appid, session, appUniqueName, [settingsId], [lang])
GET  /1.0/marketplace/installation/rest/getenvappid     # GetEnvAppid(appid, session, appUniqueName)
GET  /1.0/marketplace/installation/rest/getscriptingappid
POST /1.0/marketplace/installation/rest/executeaction   # ExecuteAction(appid, session, appUniqueName, [action], [settingsId], [params], [lang])
POST /1.0/marketplace/installation/rest/uninstall       # Uninstall(appid, session, appUniqueName, [force])
```

---

## Apps do Marketplace (`marketplace.App`, 10 métodos)

### GetList — Listar aplicações disponíveis

```
GET /1.0/marketplace/app/rest/getlist
```
`GetList(appid, session, [search], [lang], [checksum])`

### GetCategories — Categorias do marketplace

```
GET /1.0/marketplace/app/rest/getcategories
```
`session`, `appid`

### Demais métodos

```
GET  /1.0/marketplace/app/rest/getappinfo     # GetAppInfo(appid, session, id, [lang], [ownerUid])
GET  /1.0/marketplace/app/rest/getaddonlist   # GetAddonList(envName, session, [nodeGroup], [search], [lang])
GET  /1.0/marketplace/app/rest/getchecksum
POST /1.0/marketplace/app/rest/install        # Install(appid, session, id, [envName], [settings], ...)
POST /1.0/marketplace/app/rest/installaddon   # InstallAddon(envName, session, id, [settings], [nodeGroup], [skipEmail])
POST /1.0/marketplace/app/rest/addapp         # AddApp(appid, session, manifest)
POST /1.0/marketplace/app/rest/editapp        # EditApp(appid, session, id, manifest)
POST /1.0/marketplace/app/rest/deleteapp      # DeleteApp(appid, session, id)
```

---

## Favoritos (`marketplace.Favorite`, 4 métodos)

```
GET  /1.0/marketplace/favorite/rest/getlist      # GetList(appid, session, [search], [lang], [checksum])
POST /1.0/marketplace/favorite/rest/add          # Add(appid, session, id)
POST /1.0/marketplace/favorite/rest/addmanifest  # AddManifest(appid, session, manifest)
POST /1.0/marketplace/favorite/rest/delete       # Delete(appid, session, id)
```
