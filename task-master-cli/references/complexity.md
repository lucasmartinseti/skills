# Complexity — Referência de Comandos

## analyze-complexity

```bash
# Analisar complexidade de todas as tasks
task-master analyze-complexity

# Salvar relatório em local customizado
task-master analyze-complexity --output=my-report.json

# Usar modelo LLM específico
task-master analyze-complexity --model=claude-3-opus-20240229

# Definir threshold de complexidade customizado (1–10)
task-master analyze-complexity --threshold=6

# Usar arquivo de tasks alternativo
task-master analyze-complexity --file=custom-tasks.json

# Análise com pesquisa via Perplexity AI
task-master analyze-complexity --research
```

## complexity-report

```bash
# Exibir relatório de complexidade
task-master complexity-report

# Visualizar relatório em local customizado
task-master complexity-report --file=my-report.json
```
