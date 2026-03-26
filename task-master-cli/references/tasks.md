# Tasks — Referência de Comandos

## list

```bash
# Listar todas as tasks
task-master list

# Filtrar por status
task-master list --status=<status>

# Incluir subtasks
task-master list --with-subtasks

# Filtrar por status e incluir subtasks
task-master list --status=<status> --with-subtasks

# Modo watch (atualização automática)
task-master list --watch
task-master list -w

# Combinar watch com outras opções
task-master list all -w
task-master list -w --compact
task-master list --status=pending -w
```

## show

```bash
# Detalhes de uma task específica
task-master show <id>
task-master show --id=<id>

# Detalhes de uma subtask (ex.: subtask 2 da task 1)
task-master show 1.2
```

## next

```bash
# Próxima task recomendada com base em dependências e status
task-master next
```

## add-task

```bash
# Adicionar nova task via AI
task-master add-task --prompt="Descrição da nova task"

# Com dependências
task-master add-task --prompt="Descrição" --dependencies=1,2,3

# Com prioridade
task-master add-task --prompt="Descrição" --priority=high
```

## update

```bash
# Atualizar tasks a partir de um ID com contexto
task-master update --from=<id> --prompt="<prompt>"
```

## update-task

```bash
# Atualizar uma task específica com novas informações
task-master update-task --id=<id> --prompt="<prompt>"

# Com pesquisa via Perplexity AI
task-master update-task --id=<id> --prompt="<prompt>" --research
```

## set-status

```bash
# Definir status de uma task
task-master set-status --id=<id> --status=<status>

# Definir status de múltiplas tasks
task-master set-status --id=1,2,3 --status=<status>

# Definir status de subtasks
task-master set-status --id=1.1,1.2 --status=<status>
```

> Ao marcar uma task como `done`, todas as subtasks são automaticamente marcadas como `done`.

## generate

```bash
# Gerar arquivos individuais de task a partir do tasks.json
task-master generate
```
