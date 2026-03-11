---
name: frontend-nextjs-admin-ingestao
description: Implementa e evolui fluxo de admin para ingestão manual no Next.js App Router com API segura e feedback de execução. Use quando houver pedidos sobre tela admin, endpoint /api/admin/ingest-news, token e UX operacional.
---

# Frontend Next.js Admin Ingestão

## Objetivo
Padronizar mudanças no fluxo manual de publicação diária.

## Instruções
1. Trabalhar em TDD: teste primeiro, falha, implementação mínima, refatoração.
2. Preservar contrato da API:
   - endpoint `POST /api/admin/ingest-news`,
   - autenticação por token admin,
   - resposta com `processedSourceIds`, `createdArticles`, `discardedByLanguage`.
3. Manter UI com estados claros:
   - loading,
   - erro de autenticação/requisição,
   - sucesso com resumo operacional.
4. Garantir conteúdo e mensagens em Português Brasileiro.
5. Sempre validar regressão em `/admin` e rotas públicas afetadas.

## Checklist rápido
- [ ] Contrato da API preservado
- [ ] Segurança por token mantida
- [ ] Feedback visual adequado
- [ ] Testes novos/ajustados
- [ ] Sem acoplamento novo em `app/` com regras de negócio
