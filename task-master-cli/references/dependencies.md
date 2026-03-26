# Dependencies — Referência de Comandos

## add-dependency / remove-dependency

```bash
# Adicionar dependência a uma task
task-master add-dependency --id=<id> --depends-on=<id>

# Remover dependência de uma task
task-master remove-dependency --id=<id> --depends-on=<id>
```

## validate-dependencies / fix-dependencies

```bash
# Validar dependências sem corrigir
task-master validate-dependencies

# Localizar e corrigir dependências inválidas automaticamente
task-master fix-dependencies
```
