# AGENTS — Notícias (genérico + YouTube)

## Propósito (ler primeiro)
Ferramenta **pessoal** de agregação e produção de conteúdo sobre **IA** — **não** um site público multi-usuário. Uso local, só pelo operador. Não será publicado para audiência externa.

Objetivos:
1. **Agregar** informações sobre assuntos (foco: IA) — RSS, YouTube, catálogo.
2. **Relatórios** sobre o agregado, para aprender, ensinar e compartilhar na comunidade (vídeos do operador).
3. **Criar conteúdos** a partir do agregado (pauta, shorts, apresentações, etc.).
4. **Organizar** o acervo (assuntos, tipos, tags, fontes, filtro editorial/pauta).

Implicações:
- Priorizar eficiência operacional do operador (não marketing/onboarding de visitantes).
- **Admin no menu** é necessário; manter atalho fácil.
- Home pública **não** é o destino principal — pode redirecionar para `/admin`. Rotas “públicas” (`/news`, `/videos`, `/sistema`, …) são preview/utilidade do operador.
- UI e copy devem favorecer: ingestão → organização → relatório → criação/compartilhamento.

Rule espelho: `.cursor/rules/product-purpose.mdc`.

## Missão de domínio
Acervo de **notícias de inteligência artificial** e **vídeos YouTube**, com entidades temáticas (`subject` / `type` / `tag` / `source`). O domínio **não** é games: não introduzir conceitos, rotas, schemas ou copy exclusivos de jogos.

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
- Rules: `.cursor/rules/` (propósito do produto, glossário, depreciação, boundaries, TDD, decoupling, subagents)
- Skills: `.cursor/skills/README.md`
- ADRs: `docs/adr/` (0001 governança, 0002 boundaries, 0003 domínio)

## Rotas críticas (alvo operacional)
`/admin` (hub principal), ingestão, listagens editoriais, relatórios, criação de conteúdo — e previews úteis (`/news/[slug]`, vídeos, `/sistema`). Não `/games`, `/games-like`, `/hardware`.

## Migração de código/DB
Playbook: skill `domain-migrate-games-to-subjects` (Fase 1+). Fase 0 = só este harness.
