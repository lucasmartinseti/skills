# Files & Logs

**Classes:** `environment.File` (23 métodos)  
**Logs:** via `environment.Control` — `GetLogs`, `ReadLog`, `GetLogsList`, `ClearLog`  
**Docs completos:** Memory → `notes/jelastic-api-environment`

---

## Gerenciamento de Arquivos

### Read — Ler conteúdo de arquivo

```
GET /1.0/environment/file/rest/read
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `path` | Sim | Caminho absoluto do arquivo |

**Retorno:** `{ "body": "conteúdo...", "result": 0 }`

### Write — Escrever/sobrescrever arquivo

```
POST /1.0/environment/file/rest/write
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `path` | Sim | Caminho absoluto |
| `body` | Sim | Conteúdo a escrever |
| `nodeGroup` | Não | Escrever em todos os nós do grupo |
| `isAppend` | Não | `true` para append (não sobrescrever) |

### GetList — Listar arquivos/diretórios

```
GET /1.0/environment/file/rest/getlist
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `path` | Sim | Diretório a listar |
| `filter` | Não | Filtro de nome (glob) |

### Create — Criar arquivo ou diretório vazio

```
POST /1.0/environment/file/rest/create
```
`session`, `envName`, `nodeid`, `path`, `[nodeGroup]`, `[overwrite]`

### Delete — Remover arquivo

```
POST /1.0/environment/file/rest/delete
```
`session`, `envName`, `nodeid`, `path`, `[nodeGroup]`

### Copy — Copiar arquivo no mesmo nó

```
POST /1.0/environment/file/rest/copy
```
`session`, `envName`, `nodeid`, `srcPath`, `destPath`

### Rename — Renomear/mover arquivo

```
POST /1.0/environment/file/rest/rename
```
`session`, `envName`, `nodeid`, `oldPath`, `newPath`

### Upload — Upload de arquivo para o nó

```
POST /1.0/environment/file/rest/upload
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `destPath` | Sim | Caminho destino no nó |
| `nodeGroup` | Não | Fazer upload para todos os nós do grupo |
| `sourcePath` | Não | URL de origem do arquivo |

### GetFileInfo — Metadados do arquivo

```
GET /1.0/environment/file/rest/getfileinfo
```
`session`, `envName`, `nodeid`, `path`

### SetFilePermissions — Alterar permissões

```
POST /1.0/environment/file/rest/setfilepermissions
```
`session`, `envName`, `nodeid`, `path`, `mode` (ex: `755`), `[nodeGroup]`, `[recursive]`

### GetFavorites / AddFavorite / DeleteFavorite

Gerenciam arquivos/diretórios favoritos no file manager do dashboard.

```
GET  /1.0/environment/file/rest/getfavorites
POST /1.0/environment/file/rest/addfavorite
POST /1.0/environment/file/rest/deletefavorite
```
`session`, `envName`, `nodeid`, `path`

---

## Logs (via environment.Control)

### GetLogsList — Listar arquivos de log disponíveis

```
GET /1.0/environment/control/rest/getlogslist
```
`session`, `envName`, `nodeid`

**Retorno:** lista de caminhos de arquivos de log no nó.

### ReadLog — Ler log com controle de offset

```
GET /1.0/environment/control/rest/readlog
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `path` | Sim | Caminho do log |

### GetLogs — Ler com filtro por linhas

```
GET /1.0/environment/control/rest/getlogs
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeid` | Sim | ID do nó |
| `path` | Sim | Caminho do log |
| `lines` | Não | Número de linhas (padrão: últimas 100) |
| `startRow` | Não | Linha inicial |

### ClearLog — Esvaziar arquivo de log

```
POST /1.0/environment/control/rest/clearlog
```
`session`, `envName`, `nodeid`, `path`

### RemoveLog — Deletar arquivo de log

```
POST /1.0/environment/control/rest/removelog
```
`session`, `envName`, `nodeid`, `path`
