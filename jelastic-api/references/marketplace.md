# Marketplace & JPS (Cloud Scripting)

**Classes:** `marketplace.Jps` (7 métodos), `marketplace.Installation` (6 métodos), `marketplace.App` (10 métodos)  
**Docs completos:** Memory → `notes/jelastic-api-marketplace`

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
| `envName` | Não | Ambiente alvo (se `type: update`) |
| `manifest` | Não* | Conteúdo JSON/YAML do manifesto inline |
| `jps` | Não* | URL para manifesto remoto |
| `settings` | Não | JSON com variáveis do manifesto |

*Forneça `manifest` ou `jps` (URL).

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

### GetScriptingTypes — Tipos disponíveis de scripting

```
GET /1.0/marketplace/jps/rest/getscriptingtypes
```
`session`, `appid`

---

## Instalações

### GetInstallations — Listar apps instalados no ambiente

```
GET /1.0/marketplace/installation/rest/getinstallations
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `envName` | Não | Filtrar por ambiente |

### Uninstall — Desinstalar app do marketplace

```
POST /1.0/marketplace/installation/rest/uninstall
```
`session`, `appid`, `envName`, `id`, `targetNodeGroup`

---

## Apps do Marketplace

### GetApps — Listar aplicações disponíveis

```
GET /1.0/marketplace/app/rest/getapps
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `search` | Não | Filtro por nome/keyword |
| `categories` | Não | Filtro por categoria |

### GetCategories — Categorias do marketplace

```
GET /1.0/marketplace/app/rest/getcategories
```
`session`, `appid`

---

## Favoritos

### GetFavorites / AddFavorite / DeleteFavorite / UpdateFavorite

```
GET  /1.0/marketplace/favorite/rest/getfavorites
POST /1.0/marketplace/favorite/rest/addfavorite
POST /1.0/marketplace/favorite/rest/deletefavorite
POST /1.0/marketplace/favorite/rest/updatefavorite
```
`session`, `appid`, `[id]`
