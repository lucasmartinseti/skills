# Authentication & Token Management

**Classe:** `users.Authentication` (12 métodos) | `users.Account` (2 métodos)  
**Docs completos:** Memory → `notes/jelastic-api-users`

---

## Signin

Cria uma sessão de usuário. **Requer POST** (método com senha).

```
POST /1.0/users/authentication/rest/signin
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `login` | Sim | Email do usuário |
| `password` | Sim | Senha da conta |
| `appid` | Sim | `dashboard` |

**Retorno:** `{ "session": "abc123...", "result": 0 }`

---

## Signout

Encerra a sessão ativa.

```
GET /1.0/users/authentication/rest/signout
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token da sessão |
| `appid` | Sim | `dashboard` |

---

## GetSessions

Lista sessões ativas da conta.

```
GET /1.0/users/authentication/rest/getsessions
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `appid` | Sim | `dashboard` |
| `session` | Sim | Token ou PAT |

---

## SignoutSessions

Encerra uma ou mais sessões específicas.

```
POST /1.0/users/authentication/rest/signoutsessions
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token atual |
| `appid` | Sim | `dashboard` |
| `sessions` | Sim | JSON array de sessions a encerrar |

---

## Personal Access Tokens (PAT)

### CreateToken

```
POST /1.0/users/authentication/rest/createtoken
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Sessão atual ou PAT existente |
| `description` | Sim | Nome descritivo do token |
| `password` | Não | Confirmação de senha (requerida em alguns hosters) |
| `tokenTemplate` | Não | Template pré-definido com permissões |
| `apiList` | Não | JSON com lista de métodos permitidos |
| `expiresAt` | Não | Data de expiração (`YYYY-MM-DD`) |

**Retorno:** `{ "token": "...", "result": 0 }`

### GetTokens

```
GET /1.0/users/authentication/rest/gettokens
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Sessão ou PAT |
| `ids` | Não | IDs específicos (JSON array) |

### DeleteTokens

```
POST /1.0/users/authentication/rest/deletetokens
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Sessão atual |
| `ids` | Sim | JSON array de IDs a deletar |
| `password` | Não | Confirmação de senha |

### GetTokenTemplates

Lista templates pré-definidos de permissão.

```
GET /1.0/users/authentication/rest/gettokentemplates
```

### GetPolicyMethods

Lista os métodos de API permitidos por uma policy.

```
GET /1.0/users/authentication/rest/getpolicymethods
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `appid` | Sim | `dashboard` |
| `session` | Sim | Sessão ou PAT |
| `uniqueName` | Não | Nome da policy |

---

## GetUserInfo

Retorna dados do perfil do usuário autenticado.

```
GET /1.0/users/account/rest/getuserinfo
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `appid` | Sim | `dashboard` |
| `session` | Sim | Sessão ou PAT |
