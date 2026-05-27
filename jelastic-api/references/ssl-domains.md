# SSL & Domains

**Classe:** `environment.Binder` (28 métodos)  
**Docs completos:** Memory → `notes/jelastic-api-environment`

---

## Domínios Externos

### BindExtDomain — Associar domínio externo

```
POST /1.0/environment/binder/rest/bindextdomain
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `extdomain` | Sim | Domínio externo (ex: `myapp.com`) |
| `certId` | Não | ID do certificado SSL a associar |

### BindExtDomains — Associar múltiplos domínios

```
POST /1.0/environment/binder/rest/bindextdomains
```
`session`, `envName`, `extDomains` (array JSON), `[certId]`

### RemoveExtDomain

```
POST /1.0/environment/binder/rest/removeextdomain
```
`session`, `envName`, `extdomain`

### GetExtDomains — Listar domínios externos

```
GET /1.0/environment/binder/rest/getextdomains
```
`appid`, `session`

### CheckExtDomain — Checar disponibilidade

```
GET /1.0/environment/binder/rest/checkextdomain
```
`appid`, `session`, `extdomain`

### SwapExtDomains — Trocar domínio entre dois ambientes

```
POST /1.0/environment/binder/rest/swapextdomains
```
`session`, `envName`, `targetEnv`

---

## Domínios Internos

### GetDomains — Listar todos os domínios do ambiente

```
GET /1.0/environment/binder/rest/getdomains
```
`session`, `envName`, `[nodeGroup]`, `[nodeId]`, `[inShort]`

### AddDomains

```
POST /1.0/environment/binder/rest/adddomains
```
`session`, `envName`, `domains`, `[nodeGroup]`, `[nodeId]`

### RemoveDomains

```
POST /1.0/environment/binder/rest/removedomains
```
`session`, `envName`, `domains`, `[nodeGroup]`, `[nodeId]`

### CheckDomain — Checar se domínio interno está disponível

```
GET /1.0/environment/binder/rest/checkdomain
```
`appid`, `[session]`, `domain`, `[region]`

---

## Certificados SSL

### AddSSLCert — Adicionar certificado SSL à conta

```
POST /1.0/environment/binder/rest/addsslcert
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `key` | Sim | Chave privada (conteúdo PEM) |
| `cert` | Sim | Certificado (conteúdo PEM) |
| `interm` | Não | Certificado intermediário/chain |

**Retorno:** `{ "id": 42, "result": 0 }` — guarde o `id` para usar em `BindSSLCert`.

### EditSSLCert — Atualizar certificado

```
POST /1.0/environment/binder/rest/editsslcert
```
`session`, `envName`, `id`, `[key]`, `[cert]`, `[interm]`

### GetSSLCerts — Listar certificados

```
GET /1.0/environment/binder/rest/getsslcerts
```
`session`, `envName`, `[ids]`

### RemoveSSLCerts — Remover certificados

```
POST /1.0/environment/binder/rest/removesslcerts
```
`session`, `envName`, `ids` (array JSON)

---

## Bind/Unbind SSL

### BindSSLCert — Associar certificado a domínios externos

```
POST /1.0/environment/binder/rest/bindsslcert
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `certId` | Sim | ID do certificado SSL |
| `entryPoint` | Não | Ponto de entrada (`SLB`, `BL`, `CP`) |
| `extDomains` | Não | Domínios específicos (array JSON) |

### UnbindSSLCert

```
POST /1.0/environment/binder/rest/unbindsslcert
```
`session`, `envName`, `extDomains` (array JSON)

### GetSSL — SSL integrado Jelastic

```
GET /1.0/environment/binder/rest/getssl
```
`session`, `envName`

### DeleteSSL / DisableSSL

```
POST /1.0/environment/binder/rest/deletessl
POST /1.0/environment/binder/rest/disablessl
```
`session`, `envName`

---

## IPs Externos

### SetExtIpCount — Definir número de IPs externos

```
POST /1.0/environment/binder/rest/setextipcount
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `envName` | Sim | Nome do ambiente |
| `nodeGroup` | Sim | Grupo de nós |
| `count` | Sim | Quantidade de IPs |
| `type` | Não | `ipv4` ou `ipv6` |

### DetachExtIp — Desanexar IP específico

```
POST /1.0/environment/binder/rest/detachextip
```
`session`, `envName`, `nodeid`, `ip`

### SwapExtIps — Trocar IPs entre nós ou ambientes

```
POST /1.0/environment/binder/rest/swapextips
```
`session`, `envName`, `sourceNodeId`, `targetNodeId`, `[targetEnvName]`

### MoveExtIps — Mover IPs de um nó para outro

```
POST /1.0/environment/binder/rest/moveextips
```
`session`, `envName`, `sourceNodeId`, `targetNodeId`, `ips` (array JSON)
