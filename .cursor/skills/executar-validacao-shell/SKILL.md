---
name: executar-validacao-shell
description: Executa validação técnica com subagent shell (testes, lint, typecheck, smoke) e retorna status por etapa. Use após alterações de frontend Next.js, integrações API e mudanças em packages.
---

# Executar Validação com Shell

## Objetivo
Padronizar validação técnica via terminal com resultado auditável.

## Instruções
1. Definir checklist da alteração.
2. Acionar subagent `shell`.
3. Executar na ordem:
   - `npm test`,
   - validações adicionais da tarefa (quando existirem),
   - checagens de runtime local (se aplicável).
4. Retornar tabela de status com falhas e próximos passos.

## Saída padrão
```markdown
## Validação Técnica

| Etapa | Status | Observação |
|---|---|---|
| Testes | feito/falhou/pendente | ... |
| Lint | ... | ... |
| Typecheck | ... | ... |
| Smoke local | ... | ... |
```
