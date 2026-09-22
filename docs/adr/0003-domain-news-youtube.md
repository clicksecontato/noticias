# ADR 0003: Domínio Notícias Genéricas + YouTube

- Status: Accepted
- Date: 2026-09-22

## Contexto

O monorepo nasceu orientado a **games/jogos** (tabelas, rotas SEO, Schema.org `VideoGame`, brand). O produto deve passar a ser um portal de **notícias genéricas** com **vídeos YouTube**, reutilizando ingestão, admin, enrichment e SEO programático — sem acoplamento semântico a jogos.

## Decisão

### Glossário canônico

| PT (UI) | EN (código / DB) | Substitui |
|---------|------------------|-----------|
| assunto | subject | jogo / game |
| tipo | type | gênero / genre |
| tag | tag | (mantém) |
| fonte | source | (mantém; RSS + YouTube) |
| notícia / artigo | news / article | (mantém) |
| vídeo | youtube_video | (mantém) |

Relatório `top_games` → `top_subjects`. Similaridade `games-like` → assuntos relacionados (`subjects-like` / `related`).

### Deprecar e não portar

- **platform / plataforma** (consoles): remover do modelo canônico. Origem de conteúdo = `source`. Ecossistemas/marcas = `subject` ou `type`, não “platform”.
- **hardware / RAM** e rota `/hardware/[ram]`.
- Rota composta `/best/[genre]/[platform]`.
- Schema.org **VideoGame** / `gamePlatform`.
- Copy e prompts centrados em gameplay, gamer, trailer-as-default.
- Brand “Notícias Games” / domínio `noticiasgames.com` como **modelo canônico** (troca de brand/env fica em fase de produto; não usar como destino em novos artefatos).

### Rotas alvo (SEO / app)

| Tipo | Path alvo |
|------|-----------|
| Notícia | `/news/[slug]` |
| Assunto | `/subjects/[slug]` (ou equivalente PT acordado na migração) |
| Relacionados | `/subjects-like/[slug]` ou `/related/[slug]` |
| Por tipo | `/best/[type]` (ou `/tipos/[slug]`) |
| Vídeos | rotas públicas de vídeo já existentes / alinhadas |
| Admin | `/admin/*` (assuntos, tipos, tags, fontes, notícias, vídeos) |

Redirects 301 das URLs legadas (`/games/*`, `/games-like/*`, `/hardware/*`, `/best/.../platform`) entram na Fase 1+ (código), não nesta ADR de harness.

### pageType (registry)

Valores canônicos a evoluir no registry único: `news`, `subject`, `subjects-like` (ou `related`), `best-type`, `video` (conforme existir). Não adicionar `game`, `hardware`, `best-genre-platform` como destino.

## Consequências

Positivas:
- harness e agentes alinhados ao domínio certo antes do refactor;
- taxonomia reutilizável para qualquer nicho (ex.: IA);
- `source` cobre RSS e YouTube sem “plataforma de console”.

Custos:
- migração DB/código (Fase 1+) com remoção de `platforms` e rotas hardware;
- redirects SEO e limpeza de seeds/fontes games em fases posteriores.

## Guardrails

- Novos artefatos (código, docs de destino, skills) usam o glossário desta ADR.
- Menções a games só em deprecation, migration playbook ou histórico.
- Harness: `.cursor/rules/domain-glossary.mdc`, `deprecation-games-domain.mdc`, skill `domain-migrate-games-to-subjects`.
