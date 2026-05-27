# Billing & Quotas

**Classes:** `billing.Account` (3 métodos), `billing.Subscription` (15 métodos)  
**Docs completos:** Memory → `notes/jelastic-api-billing`

---

## billing.Account

### GetQuotas — Listar cotas da conta

Retorna os limites configurados para a conta (número máximo de ambientes, cloudlets, IPs, etc.).

```
GET /1.0/billing/account/rest/getquotas
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `quotasnames` | Não | Lista de nomes de cotas separados por `;` |

**Cotas comuns:** `environment.maxnum`, `environment.maxcloudletsperrec`, `environment.externalips`, `environment.maxnodescount`.

### GetExtendedAccountBillingHistoryByPeriod — Histórico de faturamento

```
GET /1.0/billing/account/rest/getextendedaccountbillinghistorybyperiod
```

| Parâmetro | Obrigatório | Descrição |
|-----------|-------------|-----------|
| `session` | Sim | Token/PAT |
| `appid` | Sim | `dashboard` |
| `starttime` | Sim | Data início (`YYYY-MM-DD HH:mm:ss`) |
| `endtime` | Sim | Data fim (`YYYY-MM-DD HH:mm:ss`) |
| `targetAppid` | Não | Filtrar por ambiente específico |

---

## billing.Subscription

Gerenciamento de planos e assinaturas de recursos.

### GetSubscriptions — Listar assinaturas

```
GET /1.0/billing/subscription/rest/getsubscriptions
```
`session`, `appid`, `[id]`, `[status]`

### GetProducts — Listar produtos disponíveis para assinatura

```
GET /1.0/billing/subscription/rest/getproducts
```
`session`, `appid`

### CreateSubscription — Criar assinatura

```
POST /1.0/billing/subscription/rest/createsubscription
```
`session`, `appid`, `productId`, `planId`, `quantity`

### CancelSubscription — Cancelar assinatura

```
POST /1.0/billing/subscription/rest/cancelsubscription
```
`session`, `appid`, `id`

### GetSubscriptionServicePlans — Listar planos de um produto

```
GET /1.0/billing/subscription/rest/getsubscriptionserviceplans
```
`session`, `appid`, `productId`

> Para os demais 10 métodos de `billing.Subscription`, consulte Memory → `notes/jelastic-api-billing`.
