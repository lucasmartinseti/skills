# Autopilot — TDD Workflow para Agentes AI

## Overview

O TaskMaster fornece um sistema de orquestração TDD que permite agentes AI implementarem features de forma autônoma seguindo o ciclo **RED → GREEN → COMMIT**.

### Key Features

- **TDD State Machine**: Enforça ciclo RED → GREEN → COMMIT
- **Git Integration**: Criação automática de branch e commits com metadata
- **Test Validation**: Garante que RED tem falhas e GREEN passa todos os testes
- **Progress Tracking**: Conclusão de subtasks, contagem de tentativas, log de erros
- **State Persistence**: Gerenciamento automático de estado do workflow

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│                   AI Agent                          │
│  (Claude Code, Custom Agent, etc.)                  │
└─────────────┬───────────────────────────────────────┘
              │ Uses CLI
              │
┌─────────────▼───────────────────────────────────────┐
│         WorkflowOrchestrator (Core)                 │
│  ┌─────────────────────────────────────────────┐   │
│  │  State Machine: RED → GREEN → COMMIT        │   │
│  └─────────────────────────────────────────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │GitAdapter│  │TestResult│  │CommitMessage │    │
│  │          │  │Validator │  │Generator     │    │
│  └──────────┘  └──────────┘  └──────────────┘    │
└────────────────────────────────────────────────────┘
          │ Persists to
┌─────────▼───────────────────────────────────────────┐
│  .taskmaster/workflow-state.json                     │
└──────────────────────────────────────────────────────┘
```

## Getting Started

### Pré-requisitos

1. Projeto TaskMaster inicializado com subtasks
2. Repositório git com working tree limpo
3. Framework de testes configurado (vitest, jest, etc.)

### Quick Start

```bash
# 1. Inicializar workflow para uma task
tm autopilot start 7

# 2. Verificar próxima ação
tm autopilot next

# 3. Escrever teste falhando (RED phase)
# ... criar arquivo de teste ...

# 4. Rodar testes e completar RED phase
tm autopilot complete --results '{"total":1,"passed":0,"failed":1,"skipped":0}'

# 5. Implementar código para passar nos testes (GREEN phase)
# ... escrever implementação ...

# 6. Rodar testes e completar GREEN phase
tm autopilot complete --results '{"total":1,"passed":1,"failed":0,"skipped":0}'

# 7. Commitar mudanças
tm autopilot commit

# 8. Repetir para próxima subtask (avança automaticamente)
tm autopilot next
```

## CLI Commands

Todos os comandos suportam `--json` para output legível por máquina.

### tm autopilot start \<taskId\>

Inicializa um novo workflow TDD para uma task.

**Options:**
- `--max-attempts <number>`: Máximo de tentativas por subtask (default: 3)
- `--force`: Forçar início mesmo se workflow já existe
- `--project-root <path>`: Diretório raiz do projeto **Sempre usar esse parametro.**
- `--json`: Output JSON

```bash
tm autopilot start 7 --project-root <path> --max-attempts 5 --json
```

**JSON Output:**
```json
{
  "success": true,
  "taskId": "7",
  "branchName": "task-7",
  "phase": "SUBTASK_LOOP",
  "tddPhase": "RED",
  "progress": { "completed": 0, "total": 5, "percentage": 0 },
  "currentSubtask": { "id": "1", "title": "Implement start command", "status": "in-progress", "attempts": 0 },
  "nextAction": "generate_test"
}
```

### tm autopilot resume

Retoma um workflow previamente iniciado a partir do estado salvo.

```bash
tm autopilot resume --json
```

### tm autopilot next

Retorna a próxima ação a executar com contexto detalhado.

```bash
tm autopilot next --json
```

**JSON Output:**
```json
{
  "action": "generate_test",
  "actionDescription": "Write a failing test for the current subtask",
  "phase": "SUBTASK_LOOP",
  "tddPhase": "RED",
  "currentSubtask": { "id": "1", "title": "Implement start command", "attempts": 0, "maxAttempts": 3 },
  "expectedFiles": ["test file"],
  "context": { "canProceed": false, "errors": [] }
}
```

### tm autopilot status

Retorna progresso e estado completo do workflow.

```bash
tm autopilot status --json
```

### tm autopilot complete

Completa a fase TDD atual com validação dos resultados de teste.

**Options:**
- `--results <json>`: JSON com resultados dos testes

```bash
tm autopilot complete --results '{"total":10,"passed":9,"failed":1,"skipped":0}' --json
```

**Regras de validação:**
- **RED Phase**: deve ter ao menos um teste falhando
- **GREEN Phase**: todos os testes devem passar (failed === 0)

### tm autopilot commit

Cria um git commit com geração automática de mensagem.

**Options:**
- `--message <text>`: Mensagem customizada (opcional)
- `--files <paths...>`: Arquivos específicos para stage (opcional)

```bash
tm autopilot commit --json
```

### tm autopilot abort

Aborta o workflow e limpa o estado (preserva branch git e código).

```bash
tm autopilot abort --force --json
```

## Workflow Phases

```text
PREFLIGHT → BRANCH_SETUP → SUBTASK_LOOP → FINALIZE → COMPLETE
                                   ↓
                          RED → GREEN → COMMIT
                           ↑              ↓
                           └──────────────┘
                             (Next Subtask)
```

| Fase | Descrição |
|------|-----------|
| **PREFLIGHT** | Valida task, estado do git e pré-condições |
| **BRANCH_SETUP** | Cria branch `task-{taskId}` e inicializa contexto |
| **SUBTASK_LOOP / RED** | Escrever testes falhando (`generate_test`) |
| **SUBTASK_LOOP / GREEN** | Implementar código (`implement_code`) |
| **SUBTASK_LOOP / COMMIT** | Commitar e avançar subtask (`commit_changes`) |
| **FINALIZE** | Todas as subtasks concluídas, pronto para review/merge |
| **COMPLETE** | Workflow finalizado |

## Responsibility Matrix

| Responsabilidade | AI Agent | TaskMaster |
|-----------------|----------|------------|
| Orquestração do workflow | Chamar CLI | Executar & validar |
| Rastrear estado | Ler estado | Persistir estado |
| Gerenciar fases TDD | Solicitar transições | Enforçar transições |
| Validar conclusão de fase | | ✓ |
| **Testes** | | |
| Escrever código de teste | ✓ | |
| Rodar testes | ✓ | |
| Parsear output dos testes | ✓ | |
| Reportar resultados | Fornecer JSON | Validar resultados |
| **Implementação** | | |
| Escrever código de implementação | ✓ | |
| Garantir que testes passam | ✓ | |
| **Git** | | |
| Criar branch do workflow | Solicitar | ✓ Executar |
| Gerar mensagens de commit | | ✓ |
| Criar commits | Solicitar | ✓ Executar |
| **Progress** | | |
| Consultar progresso | Chamar status | ✓ Fornecer dados |
| Avançar subtasks | | ✓ (automático no commit) |

## Example: Complete TDD Cycle

```bash
# 1. Start
$ tm autopilot start 7 --json
# → tddPhase: RED, nextAction: generate_test

# 2. Get next action
$ tm autopilot next --json
# → action: generate_test

# 3. Write failing test (AI Agent cria o arquivo)
# tests/start.test.ts

# 4. Run tests (must fail), then complete RED
$ tm autopilot complete --results '{"total":1,"passed":0,"failed":1,"skipped":0}' --json
# → previousPhase: RED, currentPhase: GREEN, nextAction: implement_code

# 5. Write implementation (AI Agent cria o arquivo)
# src/commands/start.ts

# 6. Run tests (must pass), then complete GREEN
$ tm autopilot complete --results '{"total":1,"passed":1,"failed":0,"skipped":0}' --json
# → previousPhase: GREEN, currentPhase: COMMIT, nextAction: commit_changes

# 7. Commit
$ tm autopilot commit --json
# → subtaskCompleted: "1", currentSubtask: { id: "2" }, nextAction: generate_test
```

## Error Handling

### Workflow Already Exists
```json
{ "error": "Workflow already in progress", "suggestion": "Use autopilot resume" }
```
```bash
tm autopilot resume
# ou forçar novo workflow:
tm autopilot start 7 --force
```

### RED Phase Validation Failed
```json
{ "error": "RED phase validation failed", "reason": "At least one test must be failing" }
```
Solução: escrever teste que realmente valide comportamento ainda não implementado.

### GREEN Phase Validation Failed
```json
{ "error": "GREEN phase validation failed", "actual": { "passed": 9, "failed": 1 } }
```
Solução: corrigir implementação até todos os testes passarem.

### No Staged Changes
```json
{ "error": "No staged changes to commit" }
```
Solução: criar ou modificar arquivos antes de commitar.

### Git Working Tree Not Clean
```bash
git status
git add . && git commit -m "chore: save work"
# então iniciar workflow
```

### State File Corrupted
```bash
cat .taskmaster/workflow-state.json
tm autopilot abort --force
tm autopilot start 7
```

### Branch Conflicts
```bash
git branch -D task-7
tm autopilot start 7
```

## Prompts para AI Agents

### Iniciar uma task
```
Quero implementar a Task 7 usando TDD workflow. Por favor:
1. Inicie o workflow autopilot
2. Mostre a primeira subtask a implementar
3. Inicie o ciclo RED-GREEN-COMMIT
```

### RED Phase — Escrevendo testes falhando
```
Estamos na RED phase para a subtask "{SUBTASK_TITLE}". Por favor:
1. Leia os requisitos da subtask
2. Escreva um teste que valide o comportamento
3. O teste DEVE falhar porque a feature ainda não existe
4. Rode os testes e reporte os resultados para completar a RED phase
```

### GREEN Phase — Implementando
```
Estamos na GREEN phase. O teste está falhando com: {ERROR_MESSAGE}

Por favor:
1. Implemente o código mínimo para fazer este teste passar
2. Não over-engineer ou adicione features não testadas
3. Rode os testes e reporte os resultados para completar a GREEN phase
```

### Verificar progresso
```
Qual é o estado atual do workflow? Por favor mostre:
- Qual subtask estamos
- Fase TDD atual (RED/GREEN/COMMIT)
- Percentual de progresso
- Próxima ação necessária
```

### Retomar trabalho
```
Tenho um workflow em andamento. Por favor:
1. Retome o workflow autopilot
2. Mostre o status atual
3. Continue de onde paramos
```
