# Subtasks — Referência de Comandos

## expand

```bash
# Expandir uma task específica em subtasks
task-master expand --id=<id> --num=<number>

# Expandir com contexto adicional
task-master expand --id=<id> --prompt="<contexto>"

# Expandir todas as tasks pendentes
task-master expand --all

# Forçar regeneração de subtasks (mesmo para tasks que já têm subtasks)
task-master expand --all --force

# Geração com pesquisa via Perplexity AI
task-master expand --id=<id> --research
task-master expand --all --research
```

## update-subtask

Diferente do `update-task` (que substitui), o `update-subtask` **acrescenta** informações à subtask existente, marcando com timestamp. Útil para enriquecer subtasks de forma iterativa preservando o conteúdo original.

```bash
# Acrescentar informações a uma subtask
task-master update-subtask --id=<parentId.subtaskId> --prompt="<prompt>"

# Exemplo: adicionar detalhe sobre rate limiting à subtask 2 da task 5
task-master update-subtask --id=5.2 --prompt="Add rate limiting of 100 requests per minute"

# Com pesquisa via Perplexity AI
task-master update-subtask --id=<parentId.subtaskId> --prompt="<prompt>" --research
```

## clear-subtasks

```bash
# Remover subtasks de uma task específica
task-master clear-subtasks --id=<id>

# Remover subtasks de múltiplas tasks
task-master clear-subtasks --id=1,2,3

# Remover subtasks de todas as tasks
task-master clear-subtasks --all
```
