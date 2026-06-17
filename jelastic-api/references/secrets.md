# Secrets (Configuration)

Classe **`configuration.Secrets`** introduzida na API v8.15.1. Gerencia *secrets* — objetos que armazenam dados sensíveis como senhas, tokens e chaves — de forma centralizada.

**Namespace base:** `https://[hoster-api-host]/1.0/configuration/secrets/rest/{method}`
**Docs completos:** https://docs.jelastic.com/api/8.15.1/public/#!/api

> Todas as chamadas exigem `session` (PAT ou token) e `appid`. O parâmetro `scope` define o nível do secret (ex.: conta vs. ambiente).

---

## Métodos (6)

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `CreateSecret` | `appid, session, secretName, data, [description]` | Cria um único secret |
| `CreateSecrets` | `appid, session, secrets, [scope], [description]` | Cria múltiplos secrets de uma vez (`secrets` = JSON array) |
| `ApplySecrets` | `appid, session, secrets, [scope], [description]` | Cria ou atualiza (upsert) secrets |
| `GetSecret` | `appid, session, secretName, [scope]` | Recupera um secret pelo nome |
| `ListSecrets` | `appid, session, [secretNames], [scope]` | Lista secrets (filtrável por nomes) |
| `DeleteSecrets` | `appid, session, secretNames, [scope]` | Remove um ou mais secrets |

---

## Exemplos

**Criar um secret:**
```bash
jelastic "configuration/secrets/rest/createsecret" \
  -d "secretName=DB_PASSWORD" \
  --data-urlencode "data=S3cretValue" \
  -d "description=Senha do banco de produção"
```

**Criar/atualizar múltiplos (upsert):**
```bash
jelastic "configuration/secrets/rest/applysecrets" \
  --data-urlencode 'secrets=[{"name":"API_KEY","data":"abc123"},{"name":"JWT_SECRET","data":"xyz789"}]'
```

**Listar:**
```bash
jelastic "configuration/secrets/rest/listsecrets" | jq '.secrets[].name'
```

**Recuperar um:**
```bash
jelastic "configuration/secrets/rest/getsecret" -d "secretName=DB_PASSWORD"
```

**Remover:**
```bash
jelastic "configuration/secrets/rest/deletesecrets" \
  --data-urlencode 'secretNames=["DB_PASSWORD","API_KEY"]'
```

---

## Notas de Segurança

- Nunca registre o valor (`data`) dos secrets em logs ou no histórico do shell.
- Prefira `--data-urlencode` para evitar exposição em `ps`/histórico quando possível, e injete valores via variáveis de ambiente.
- Use `scope` para isolar secrets por ambiente e reduzir o raio de impacto.
