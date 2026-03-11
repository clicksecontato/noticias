---
name: executar-qa-browser
description: Executa QA funcional no navegador com subagent browser-use e retorna checklist com evidências. Use quando houver mudanças em telas, fluxo admin, botões de ação e respostas de API.
---

# Executar QA com Browser-use

## Objetivo
Validar comportamento real da interface após mudanças de frontend.

## Instruções
1. Definir cenários críticos (principal + erro + persistência/reload).
2. Acionar subagent `browser-use`.
3. Validar:
   - fluxo principal do `/admin`,
   - resposta visual para falha de autenticação,
   - resultado exibido após sucesso.
4. Registrar evidências objetivas por cenário.

## Saída padrão
```markdown
## QA Funcional
- [✅/❌] Cenário principal
- [✅/❌] Cenário de erro
- [✅/❌] Persistência após reload

### Evidências
- ...
```
