---
name: executar-mapeamento-explore
description: Executa mapeamento técnico amplo usando subagent explore e devolve impacto por camada, risco e ordem de execução. Use quando houver mudança transversal em rotas Next.js, providers, SEO e integrações com packages.
---

# Executar Mapeamento com Explore

## Objetivo
Usar subagent `explore` para levantar impacto de mudanças amplas no frontend e integrações.

## Instruções
1. Definir o tema de mapeamento (ex.: nova rota admin, refactor de metadata, mudança em provider).
2. Acionar subagent `explore`.
3. Solicitar retorno estruturado:
   - arquivos por camada (`apps/web`, `packages/seo`, `packages/database`, `packages/scraping`),
   - risco por item,
   - ordem segura de alteração,
   - lacunas e dependências.
4. Consolidar em plano objetivo de execução.

## Saída padrão
```markdown
## Mapeamento de Impacto
- Escopo:
- Risco geral:

### apps/web
- ...

### packages/seo
- ...

### packages/database
- ...

### Ordem sugerida
1. ...
2. ...
```
