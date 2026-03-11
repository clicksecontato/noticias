---
name: frontend-seo-rotas-app-router
description: Implementa e valida rotas SEO no App Router com generateStaticParams, generateMetadata e ISR de forma desacoplada. Use quando houver mudanças em /news, /games, /best, /games-like, /hardware ou metadata SEO.
---

# Frontend SEO Rotas App Router

## Objetivo
Manter consistência de publicação SEO no frontend com baixo acoplamento.

## Instruções
1. Centralizar estratégia em providers/registries já existentes (`config`, `strategy`, `content-provider`).
2. Em rotas App Router, manter somente composição:
   - `generateStaticParams`,
   - `generateMetadata`,
   - `revalidate`.
3. Evitar hardcode novo de conteúdo dentro de `app/`.
4. Validar canonical, OpenGraph e descrição em pt-BR.
5. Aplicar TDD para qualquer mudança em contratos de rota.

## Critérios de aceite
- Rotas continuam com metadata coerente por entidade.
- Estratégia de revalidate não regressa.
- Testes de rotas e metadata seguem verdes.
