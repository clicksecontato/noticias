# AGENTS — Notícias (genérico + YouTube)

## Missão
Portal de **notícias de inteligência artificial** e **vídeos YouTube**, com entidades temáticas (`subject` / `type` / `tag` / `source`). O domínio **não** é games: não introduzir conceitos, rotas, schemas ou copy exclusivos de jogos.

## Glossário canônico
| PT (UI) | EN (código / DB) | Papel |
|---------|------------------|--------|
| assunto | subject | Entidade temática principal |
| tipo | type | Taxonomia |
| tag | tag | Etiqueta livre |
| fonte | source | Origem RSS ou canal YouTube |
| notícia / artigo | news / article | Conteúdo textual |
| vídeo | youtube_video | Conteúdo YouTube |

## Deprecado (não criar / não expandir)
`game`/`jogo`, `genre`/`gênero` (como modelo canônico), `platform`/`plataforma` (console), `/hardware`, Schema.org `VideoGame`, copy “gameplay/gamer”.

Detalhes: `docs/adr/0003-domain-news-youtube.md` e `.cursor/rules/deprecation-games-domain.mdc`.

## Harness
- Rules: `.cursor/rules/` (glossário, depreciação, boundaries, TDD, decoupling, subagents)
- Skills: `.cursor/skills/README.md`
- ADRs: `docs/adr/` (0001 governança, 0002 boundaries, 0003 domínio)

## Rotas críticas (alvo)
`/admin`, `/news/[slug]`, listagens/vídeos públicos alinhados ao glossário — não `/games`, `/games-like`, `/hardware`.

## Migração de código/DB
Playbook: skill `domain-migrate-games-to-subjects` (Fase 1+). Fase 0 = só este harness.
