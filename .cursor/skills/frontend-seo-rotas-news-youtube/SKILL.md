---
name: frontend-seo-rotas-news-youtube
description: Implementa e valida rotas SEO no App Router (generateStaticParams, generateMetadata, ISR) para notícias genéricas, assuntos/tipos e vídeos YouTube. Use quando houver mudanças em /news, /subjects, relacionados, /best/[type], rotas de vídeo ou metadata SEO.
---

# Frontend SEO — Notícias + YouTube

## Objetivo
Manter publicação SEO desacoplada para domínio de notícias genéricas e vídeos YouTube (ADR 0003).

## Instruções
1. Centralizar estratégia em providers/registries (`config`, `strategy`, `content-provider`).
2. Em rotas App Router, manter somente composição:
   - `generateStaticParams`,
   - `generateMetadata`,
   - `revalidate`.
3. Evitar hardcode de conteúdo em `app/`.
4. Canonical, OpenGraph e descrições em pt-BR; Schema.org genérico (`NewsArticle`, `VideoObject`, `Thing`) — nunca `VideoGame` como destino.
5. pageTypes canônicos: `news`, `subject`, `subjects-like`/`related`, `best-type`, `video`.
6. Não criar nem expandir `/games`, `/games-like`, `/hardware` ou `/best/.../[platform]` (só redirects na migração).
7. TDD em contratos de rota e metadata.

## Critérios de aceite
- Metadata coerente por entidade (notícia, assunto, tipo, vídeo).
- Revalidate sem regressão.
- Testes de rotas/metadata verdes.
- Nenhum novo destino canônico de games.
