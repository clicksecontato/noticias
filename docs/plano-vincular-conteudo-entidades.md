# Plano: Vincular artigos e vídeos a tags, jogos, gêneros e plataformas

Objetivo: ao salvar **artigos** (RSS) e **vídeos** (YouTube), popular e vincular às tabelas já existentes (**tags**, **jogos** = games, **tags_do_jogo** = game_tags, **generos** = genres, **plataformas** = platforms, **sources**) para permitir relatórios ricos e filtros por assunto, jogo, gênero e plataforma no futuro.

---

## 1. Estado atual do esquema

### Tabelas existentes e uso hoje

| Tabela | Uso atual |
|--------|-----------|
| **sources** | Fontes de conteúdo (RSS/YouTube). Já vinculada a artigos via **article_sources** e a vídeos via **youtube_videos.source_id**. |
| **articles** | Notícias ingeridas por RSS. Sem vínculo com games, tags, genres, platforms. |
| **article_sources** | Relaciona artigo ↔ fonte (1:N por artigo). |
| **youtube_videos** | Vídeos ingeridos. Apenas **source_id**; sem vínculo com games, tags, genres, platforms. |
| **games** (jogos) | Catálogo de jogos (slug, name, summary, etc.). Usado em rotas/SEO; **não** ligado a artigos nem a vídeos. |
| **tags** | Catálogo de tags. |
| **game_tags** (tags_do_jogo) | Relaciona **game ↔ tag** (N:N). Não há tabela que relacione **article** ou **youtube_video** com tag ou game. |
| **genres** | Catálogo de gêneros (RPG, FPS, etc.). Não ligado a artigos nem a vídeos. |
| **platforms** | Catálogo de plataformas (PC, PS5, etc.). Não ligado a artigos nem a vídeos. |

Conclusão: **faltam tabelas de vínculo** entre conteúdo (articles, youtube_videos) e entidades (games, tags, genres, platforms). Sources já está ligada; o resto precisa ser criado e populado na persistência.

---

## 2. O que criar (migrations)

### 2.1 Tabelas de vínculo artigo ↔ entidades

- **article_games** – `article_id` (FK articles), `game_id` (FK games), PK (article_id, game_id).
- **article_tags** – `article_id`, `tag_id` (FK tags), PK (article_id, tag_id).
- **article_genres** – `article_id`, `genre_id` (FK genres), PK (article_id, genre_id).
- **article_platforms** – `article_id`, `platform_id` (FK platforms), PK (article_id, platform_id).

### 2.2 Tabelas de vínculo youtube_video ↔ entidades

- **youtube_video_games** – `youtube_video_id` (FK youtube_videos), `game_id`, PK (youtube_video_id, game_id).
- **youtube_video_tags** – `youtube_video_id`, `tag_id`, PK (youtube_video_id, tag_id).
- **youtube_video_genres** – `youtube_video_id`, `genre_id`, PK (youtube_video_id, genre_id).
- **youtube_video_platforms** – `youtube_video_id`, `platform_id`, PK (youtube_video_id, platform_id).

Índices nas FKs (e eventualmente em game_id, tag_id, etc.) para consultas e relatórios por jogo/tag/gênero/plataforma.

---

## 3. Quando popular e vincular

- **Artigos**: logo após persistir o artigo e o `article_sources` (no fluxo atual de `saveIngestedNewsItems`). Para cada artigo inserido/atualizado, rodar um passo de **enriquecimento** (ver abaixo) e gravar em `article_games`, `article_tags`, `article_genres`, `article_platforms`.
- **Vídeos**: logo após inserir cada linha em `youtube_videos` (no fluxo de `saveYoutubeVideos`). Para cada vídeo, rodar o mesmo tipo de enriquecimento e gravar em `youtube_video_*`.

Ou seja: **na hora de salvar** artigos e vídeos, tentar popular essas tabelas e vincular; não é necessário sistema de hashtags separado, e sim uso das entidades já existentes (tags, jogos, gêneros, plataformas) e das novas tabelas de vínculo.

---

## 4. Como popular (enriquecimento a partir do texto)

Ideia: a partir de **título + resumo/descrição** (e, se quiser, conteúdo completo no futuro), identificar menções a **jogos**, **tags**, **gêneros** e **plataformas** já cadastrados e preencher as tabelas de vínculo.

### 4.1 Estratégia recomendada (fase 1)

- **Só vincular a entidades existentes** (sem criar novos jogos/tags/gêneros/plataformas automaticamente), para evitar ruído e duplicatas.
- **Match por texto**:
  - Normalizar texto: minúsculas, remover acentos (opcional).
  - Para cada **game**: verificar se `name` ou `slug` aparece no texto (substring ou palavra inteira); em caso positivo, inserir em `article_games` / `youtube_video_games` (evitando duplicata por PK).
  - Para cada **tag**: mesmo critério com `name` ou `slug`.
  - Para cada **genre**: mesmo critério com `slug` ou `name`.
  - Para cada **platform**: mesmo critério com `slug` ou `name`.
- Ordem sugerida: primeiro games (nomes mais específicos), depois tags, genres, platforms, para reduzir falsos positivos (ex.: “Elden Ring” não virar só “RPG”).
- **tags_do_jogo (game_tags)**: não é obrigatório preencher ao salvar artigo/vídeo; essa tabela continua descrevendo “este jogo tem estas tags”. Se no futuro quiser “artigo que menciona o jogo X herda as tags do jogo X”, pode haver um passo opcional que, para cada (article_id, game_id) ou (youtube_video_id, game_id), insira também os (article_id, tag_id) / (youtube_video_id, tag_id) a partir de game_tags. Pode ficar para uma fase 2.

### 4.2 Onde implementar

- **Módulo de enriquecimento** (ex.: `packages/enrichment` ou `apps/web/src/enrichment`):
  - Entrada: `{ title, description }` (e opcionalmente `content`).
  - Carrega catálogos: games (id, name, slug), tags (id, name, slug), genres (id, name, slug), platforms (id, name, slug).
  - Aplica as regras de match e retorna listas de ids: `{ gameIds, tagIds, genreIds, platformIds }`.
- **Repositório** (ou serviço de persistência):
  - Novos métodos: `linkArticleToEntities(articleId, { gameIds, tagIds, genreIds, platformIds })` e `linkYoutubeVideoToEntities(youtubeVideoId, { gameIds, tagIds, genreIds, platformIds })`, que fazem os inserts/upserts nas tabelas de vínculo (sem duplicar por PK).
- **Integração no fluxo atual**:
  - **Artigos**: após `saveIngestedNewsItems` (ou dentro do mesmo caso), para cada item que resultou em artigo criado, chamar o enriquecimento com título + excerpt e em seguida `linkArticleToEntities` com o `article_id` retornado. Isso exige que o persist de artigos devolva os ids dos artigos criados (ou que se busque por slug após inserir).
  - **Vídeos**: após cada insert em `youtube_videos`, chamar enriquecimento com título + description do vídeo e `linkYoutubeVideoToEntities` com o id do vídeo inserido.

### 4.3 Detalhes técnicos

- **Normalização**: lower case; opcionalmente NFD + remover combining marks para acentos; considerar só palavras inteiras ou substrings (ex.: “Elden Ring” no título).
- **Performance**: carregar catálogos (games, tags, genres, platforms) uma vez por batch de ingestão (ou por request), não por artigo/vídeo.
- **Idempotência**: upsert com on conflict (article_id, game_id) do nothing (e análogo para as outras tabelas), para reprocessar sem duplicar.

---

## 5. Relatórios e filtros no futuro

- **Relatórios**: ao montar dados para relatórios (ex.: volume por período, ranking de fontes), permitir filtros opcionais:
  - Por **game_id** (só artigos/vídeos que mencionam o jogo X).
  - Por **tag_id**, **genre_id**, **platform_id** (idem).
  - Continua possível filtrar por **source** (já existe).
- Implementação: nas queries que alimentam os relatórios (ex.: `getArticlesForReports`, `getVideosForReports`), fazer join com `article_games` / `article_tags` / etc. e filtrar por `game_id` / `tag_id` / etc. quando o filtro for informado. Vídeos: join com `youtube_video_games`, `youtube_video_tags`, etc.
- **API de relatórios**: aceitar parâmetros opcionais `gameId`, `tagId`, `genreId`, `platformId` na geração do relatório e repassar ao repositório.
- **Frontend**: dropdowns (jogos, tags, gêneros, plataformas) ao gerar relatório, alimentados por listas já existentes (games, tags, genres, platforms).

---

## 6. Fases sugeridas de implementação

| Fase | Descrição |
|------|------------|
| **1. Migrations** | Criar as 8 tabelas de vínculo (article_* e youtube_video_*) com FKs, PKs e índices. |
| **2. Repositório** | Implementar no pacote database (ou onde estiver a persistência) os métodos de insert nas novas tabelas: `linkArticleToEntities`, `linkYoutubeVideoToEntities`, e funções para listar games/tags/genres/platforms para uso no enriquecimento e na API. |
| **3. Enriquecimento** | Módulo que recebe título + descrição, carrega catálogos (games, tags, genres, platforms) e retorna listas de ids encontrados (match por name/slug no texto). Sem criar novas entidades; apenas vincular às existentes. |
| **4. Integração na persistência de artigos** | Após criar/atualizar artigo e `article_sources`, obter article_id (e título/excerpt), chamar enriquecimento e `linkArticleToEntities`. Ajustar `saveIngestedNewsItems` (ou o persister que o usa) para retornar/ter acesso ao article_id e chamar o enriquecimento. |
| **5. Integração na persistência de vídeos** | Após cada insert em `youtube_videos`, chamar enriquecimento com título e description do vídeo e `linkYoutubeVideoToEntities` com o id do vídeo. |
| **6. Relatórios e API** | Estender repositório de relatórios para filtrar por game_id, tag_id, genre_id, platform_id (joins com as novas tabelas). API de geração de relatório aceitar esses filtros; opcionalmente endpoint para listar jogos/tags/gêneros/plataformas para os dropdowns. |
| **7. Frontend de relatórios** | Incluir filtros por jogo, tag, gênero e plataforma na tela de geração de relatório. |

---

## 7. Resumo

- **Não** criar nova tabela de “hashtags” nem de “tags por keyword”; usar as tabelas atuais **tags**, **games**, **genres**, **platforms** e **sources**.
- **Criar** apenas as **tabelas de vínculo** (article_* e youtube_video_*) entre conteúdo e essas entidades.
- **Na hora de salvar** artigos e vídeos: rodar um passo de **enriquecimento** (match de título + descrição com name/slug de games, tags, genres, platforms) e **popular os vínculos** apenas para entidades já existentes.
- Com isso, **relatórios e filtros** podem usar jogos, tags, gêneros e plataformas de forma rica, sem alterar o modelo de dados das entidades existentes; apenas ligando-as ao conteúdo que já é ingerido.
