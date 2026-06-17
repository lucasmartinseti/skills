# IaaS Resources (Infrastructure as a Service)

Categoria **`iaas`** introduzida na API v8.15.1. Permite provisionar e gerenciar recursos de infraestrutura de baixo nível (estilo OpenStack) — máquinas virtuais, volumes, snapshots, redes, IPs flutuantes, balanceadores de carga, roteadores, VPN e imagens — dentro de projetos CMP (Cloud Management Platform).

**Namespace base:** `https://[hoster-api-host]/1.0/iaas/{class}/rest/{method}`
**Docs completos:** https://docs.jelastic.com/api/8.15.1/public/#!/api

> Todas as chamadas exigem `session` (PAT ou token) e `appid`. A maioria aceita `projectId` (projeto CMP) e/ou `hostGroup` para escopo. IDs entre `[colchetes]` indicam parâmetros opcionais.

**Classes (12, ~80 métodos):** `iaas.VM` (18), `iaas.Volume` (11), `iaas.LB` (10), `iaas.Network` (8), `iaas.FloatingIP` (6), `iaas.Image` (6), `iaas.VolumeSnapshot` (5), `iaas.Router` (4), `iaas.Vpn` (4), `iaas.Project` (4), `iaas.Credential` (3), `iaas.Flavor` (1).

---

## Helper (reaproveitado do SKILL.md)

```bash
jelastic() {
  local method="$1"; shift
  curl -s "https://$JELASTIC_HOST/1.0/$method" \
    --data-urlencode "session=$JELASTIC_TOKEN" \
    --data-urlencode "appid=$JELASTIC_APPID" \
    "$@"
}
```

---

## iaas.VM — Máquinas Virtuais

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `Create` | `appid, session, [hostGroup], [projectId], vm` | Cria uma VM (`vm` = JSON com `flavor`, `image`, `name`, `adminPassword`, etc.) |
| `List` | `appid, session, [projectId], [vmId], [hostGroup]` | Lista VMs |
| `Delete` | `appid, session, [vmId]` | Remove a VM |
| `Start` / `Stop` / `Restart` | `appid, session, [vmId], [isHard]` | Liga / desliga / reinicia |
| `Actions` | `appid, session, [vmId]` | Lista ações disponíveis para a VM |
| `Shelve` / `UnRescue` / `Rescue` | `appid, session, [vmId]` (+`imageId` em Rescue) | Hibernar / sair do modo rescue / entrar em rescue |
| `SetFlavor` | `appid, session, [vmId], flavorId, [forceRestart]` | Redimensiona (vertical) |
| `SetName` | `appid, session, [vmId], vmName` | Renomeia |
| `SetDescription` | `appid, session, [vmId], [vmDescription]` | Define descrição |
| `SetAdminPassword` | `appid, session, [vmId], adminPassword` | Define senha de admin |
| `RemoteConsole` | `appid, session, [vmId]` | Obtém URL do console remoto |
| `AddNetwork` / `EditNetwork` | `appid, session, [vmId], networkData` | Anexa / edita rede |
| `RemoveNetwork` | `appid, session, [vmId], networkId, uuid` | Remove interface de rede |

**Exemplo — criar VM:**
```bash
jelastic "iaas/vm/rest/create" \
  -d "projectId=123" \
  --data-urlencode 'vm={"name":"my-vm","flavor":{"id":"m1.small"},"image":{"id":"ubuntu-22.04"},"adminPassword":"S3cret!"}'
```

**Exemplo — listar e reiniciar:**
```bash
jelastic "iaas/vm/rest/list" -d "projectId=123" | jq '.vms[] | {id, name, status}'
jelastic "iaas/vm/rest/restart" -d "vmId=456&isHard=false"
```

---

## iaas.Volume — Volumes (block storage)

| Método | Assinatura |
|--------|-----------|
| `Create` | `appid, session, hostGroup, projectId, name, policyId, size` |
| `CreateFromImage` | `appid, session, hostGroup, projectId, name, policyId, size, imageSourceId` |
| `CreateFromSnapshot` | `appid, session, name, snapshotId` |
| `List` | `appid, session, [hostGroup], [projectId]` |
| `Available` | `appid, session, [hostGroup], [projectId]` |
| `Attach` / `Detach` | `appid, session, [vmId], volumeId` |
| `Extend` | `appid, session, volumeId, size` |
| `Rename` | `appid, session, volumeId, name` |
| `Revert` | `appid, session, volumeId, snapshotId` |
| `Delete` | `appid, session, volumeId` |

```bash
jelastic "iaas/volume/rest/create" -d "hostGroup=hg1&projectId=123&name=data&policyId=ssd&size=50"
jelastic "iaas/volume/rest/attach" -d "vmId=456&volumeId=789"
```

---

## iaas.VolumeSnapshot — Snapshots de volume

| Método | Assinatura |
|--------|-----------|
| `Create` | `appid, session, volumeId, name, [description]` |
| `List` | `appid, session, [volumeId]` |
| `Rename` | `appid, session, snapshotId, [name]` |
| `UploadToImage` | `appid, session, snapshotId, imageName` |
| `Delete` | `appid, session, snapshotId` |

---

## iaas.Network — Redes e Security Groups

| Método | Assinatura |
|--------|-----------|
| `List` | `appid, session, [projectId], [hostGroup], [networkUsageType]` |
| `Attach` | `appid, session, [vmId], networkId` |
| `Detach` | `appid, session, [vmId], portId` |
| `Rename` | `appid, session, [hostGroup], networkId, name` |
| `Delete` | `appid, session, [hostGroup], networkId` |
| `ListSecurityGroup` | `appid, session, [projectId], [securityGroupIds], [hostGroup]` |
| `DeleteSecurityGroup` | `appid, session, securityGroupId, [hostGroup]` |
| `GetVMsAttachedToSecurityGroup` | `appid, session, securityGroupId` |

---

## iaas.FloatingIP — IPs flutuantes

| Método | Assinatura |
|--------|-----------|
| `Create` | `appid, session, [hostGroup], [projectId], networkId, [floatingIP]` |
| `List` | `appid, session, [hostGroup], [projectId]` |
| `Get` | `appid, session, [hostGroup], [projectId], floatingIP` |
| `Assign` | `appid, session, instanceId, [instanceType], networkId, fipId, [fixedIp]` |
| `UnAssign` | `appid, session, fipId` |
| `Delete` | `appid, session, [hostGroup], [projectId], floatingIP` |

---

## iaas.LB — Load Balancers

| Método | Assinatura |
|--------|-----------|
| `List` | `appid, session, [projectId], [lbIds], [hostGroup]` |
| `Get` | `appid, session, lbId` |
| `Edit` | `appid, session, lbId, [name], [description]` |
| `SetEnabled` | `appid, session, lbId, enabled` |
| `Delete` | `appid, session, lbId` |
| `ListBalancingPool` | `appid, session, lbId` |
| `GetBalancingPool` | `appid, session, lbId, poolId` |
| `DeleteBalancingPool` | `appid, session, lbId, poolId` |
| `DeleteBalancingPoolMember` | `appid, session, lbId, poolId, memberId` |
| `SetBalancingPoolMemberEnabled` | `appid, session, lbId, poolId, memberId, enabled` |

---

## iaas.Router — Roteadores

| Método | Assinatura |
|--------|-----------|
| `List` | `appid, session, [hostGroup], [projectId], [externalId]` |
| `Delete` | `appid, session, routerId` |
| `DeleteInterface` | `appid, session, routerId, id` |
| `DeleteStaticRoute` | `appid, session, routerId, route` |

---

## iaas.Vpn — VPN

| Método | Assinatura |
|--------|-----------|
| `List` | `appid, session, [hostGroup], [projectId]` |
| `Get` | `appid, session, vpnId` |
| `Restart` | `appid, session, vpnId` |
| `Delete` | `appid, session, vpnId` |

---

## iaas.Image — Imagens

| Método | Assinatura |
|--------|-----------|
| `List` | `appid, session, projectId, [hostGroup], [addSystem], [diskFormat]` |
| `ListSystemImages` | `appid, session, [projectId], [hostGroup]` |
| `Get` | `appid, session, projectId, [hostGroup], id` |
| `GetOSDistros` | `appid, session` |
| `Upload` | `appid, session, projectId, [hostGroup], osDistro, [imageName], [uefiCompatible]` |
| `Delete` | `appid, session, imageId` |

---

## iaas.Project — Projetos CMP

| Método | Assinatura |
|--------|-----------|
| `Create` | `appid, session, projectName, [description], [makeDefault]` |
| `Get` | `appid, session, [ownerUid]` |
| `Update` | `appid, session, [projectId], [projectName], [description], [makeDefault]` |
| `Delete` | `appid, session, [projectId]` |

---

## iaas.Credential — Application Credentials

| Método | Assinatura |
|--------|-----------|
| `Generate` | `appid, session, [projectId], credential, [hostGroup]` |
| `List` | `appid, session, [projectId], [hostGroup]` |
| `Delete` | `appid, session, id` |

---

## iaas.Flavor — Flavors (perfis de recursos)

| Método | Assinatura |
|--------|-----------|
| `List` | `appid, session, [hostGroup], [projectId]` |

```bash
jelastic "iaas/flavor/rest/list" -d "projectId=123" | jq '.flavors[] | {id, name, vcpus, ram}'
```
