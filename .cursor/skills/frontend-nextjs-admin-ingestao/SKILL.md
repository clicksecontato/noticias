---
name: frontend-nextjs-admin-ingestao
description: Implementa e evolui fluxo admin de ingestão no Next.js App Router (RSS/notícias e YouTube) com API segura e feedback operacional. Use quando houver pedidos sobre /admin, ingest-news, ingestão de vídeos YouTube, token e UX operacional.
---

# Frontend Next.js Admin Ingestão

## Objetivo
Padronizar ingestão manual e operacional de **notícias (RSS)** e **vídeos YouTube** no admin.

## Instruções
1. TDD: teste primeiro, falha, implementação mínima, refatoração.
2. Contratos de API (preservar e evoluir sem quebrar clientes):
   - `POST /api/admin/ingest-news` — token admin; resposta com `processedSourceIds`, `createdArticles`, `discardedByLanguage` (e campos estáveis existentes).
   - Fluxos YouTube no admin (listagem, vínculo, publish/shorts conforme já existir) com a mesma disciplina de auth e feedback.
3. UI com estados claros: loading, erro de auth/requisição, sucesso com resumo operacional.
4. Mensagens em Português Brasileiro; labels do glossário (assuntos, tipos, tags, fontes) — não “jogos/gêneros/plataformas” como destino.
5. Validar regressão em `/admin` e rotas públicas afetadas (`/news`, vídeos).
6. Sem acoplar regras de negócio novas dentro de `app/`; extrair para providers/services.

## Checklist rápido
- [ ] Contrato da API preservado ou versionado
- [ ] Segurança por token mantida
- [ ] Feedback visual adequado (RSS e YouTube)
- [ ] Testes novos/ajustados
- [ ] Vocabulário alinhado ao glossário (ADR 0003)
