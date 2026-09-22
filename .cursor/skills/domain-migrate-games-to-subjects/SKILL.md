---
name: domain-migrate-games-to-subjects
description: Playbook da migração de domínio games→notícias genéricas (subjects/types), incluindo remoção de platforms e hardware. Use na Fase 1+ ao renomear DB, packages, rotas SEO, APIs e UI.
---

# Migração Games → Subjects (Fase 1+)

## Objetivo
Eliminar acoplamento a games no código e DB, alinhado a ADR 0003 e ao glossário (subject/type). **Não** usar esta skill na Fase 0 (só harness).

## Glossário
- game/jogo → subject/assunto
- genre/gênero → type/tipo
- top_games → top_subjects
- games-like → subjects-like / related
- **Remover** (não renomear): platforms/consoles, `/hardware`, `/best/.../[platform]`, Schema.org VideoGame

## Ordem segura
1. Confirmar decisões já fechadas (platforms = remover; hardware = remover).
2. Testes primeiro (TDD): assertions com novos nomes/paths; falha esperada.
3. Migration SQL **nova** de rename/drop (não reescrever histórico 001+ em prod):
   - `games` → `subjects`, `genres` → `types`, FKs/junctions
   - drop `platforms` e tabelas/colunas dependentes
4. `packages/database` → `packages/seo` → `packages/scraping` (prompts enrichment inclusos).
5. APIs admin/catalogs + reports.
6. Rotas Next + redirects 301 (`/games/*` → `/subjects/*`, etc.) + revalidation/publishing.
7. UI admin/pública (copy PT).
8. Brand/env só se produto autorizar.
9. Docs/Postman/skills de destino por último.

## Critérios de aceite
- Sem `.from("games")` / `pageType: "game"` / destinos `/games` ou `/hardware` (exceto redirects e migration).
- Sem modelo canônico `platforms`.
- Suíte de testes verde; fluxos `/admin`, `/news`, vínculos subject/type ok.

## Restrições
- Respeitar ADR 0002 (boundaries) e TDD do repo.
- Não commit sem pedido explícito do usuário.
