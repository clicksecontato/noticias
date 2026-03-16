# Passos de Implementação – Relatórios e Gráficos

Este documento foca **no como** implementar (ou evoluir) os relatórios planejados em `docs/relatorios-plano.md`, priorizando os casos de uso para **vídeos no YouTube** sobre o mercado de conteúdo de games.

---

## 1. Estado atual (resumo)

- Base de dados:
  - Tabelas `reports` e `report_results` criadas e em uso.
  - Tipos suportados no backend:
    - `volume`
    - `top_sources`
    - `by_tags`
    - `by_source_detail`
    - (em andamento/planejado) `activity_by_weekday`
- Frontend (`/reports`):
  - Tela de geração e listagem de relatórios com:
    - Filtros por período, jogo, tag, gênero, plataforma, fonte.
    - Gráficos com shadcn + Recharts (volume, fontes, tags, detalhe por fonte).

---

## 2. Roadmap de funcionalidades (técnico)

### 2.1. Activity by weekday (atividade por dia da semana)

**Objetivo:** mostrar quantas publicações acontecem em cada dia da semana (Dom–Sáb), separando artigos e vídeos.

**Passos:**

1. **Tipos**
   - Em `apps/web/src/reports/types.ts`, garantir:
     - `ActivityByWeekdayPayload`:
       - `items: { weekday: number; label: string; articles: number; videos: number; total: number }[]`.

2. **Gerador**
   - Criar `apps/web/src/reports/generators/activity-by-weekday.ts`:
     - Função `generateActivityByWeekdayReport(articles, videos)` que:
       - Converte `published_at` para `getUTCDay()` (0–6).
       - Soma `articles` e `videos` por dia.
       - Preenche `label` com `["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"][weekday]`.

3. **Dispatch em `run-report`**
   - Em `apps/web/src/reports/run-report.ts`:
     - Importar o gerador.
     - Adicionar `case "activity_by_weekday"` no `switch`, retornando o payload.
     - Incluir `"activity_by_weekday"` em `SUPPORTED_REPORT_TYPES`.

4. **API**
   - Nada especial: cai no fluxo padrão que passa `articles`/`videos` para `generateReportPayload`.

5. **Frontend**
   - Criar `ActivityWeekdayChart` em `app/components/reports/ActivityWeekdayChart.tsx` (BarChart empilhado).
   - Em `app/reports/[id]/page.tsx`:
     - Adicionar `if (type === "activity_by_weekday")` renderizando o gráfico + tabela.
   - Em `ReportsClient`:
     - Adicionar opção “Atividade por dia da semana” no select de tipo.

---

### 2.2. Top games por período (`top_games`)

**Objetivo:** listar os jogos mais mencionados em notícias/vídeos no período.

**Passos:**

1. **Tipos**
   - Em `report-types.ts`:
     - Adicionar `"top_games"` em `REPORT_TYPES`.
   - Em `apps/web/src/reports/types.ts`:
     - `TopGamesPayload`:
       - `items: { game_id: string; game_name: string; articles: number; videos: number; total: number }[]`.

2. **Repositório**
   - Em `packages/database/src/content-repository.ts` (ou novo módulo `game-report-repository.ts`):
     - Criar método `getGameCountsForReports(periodStart, periodEnd, filters?)`:
       - Usa `article_games` + `articles` e `youtube_video_games` + `youtube_videos`.
       - Aplica filtros (jogo específico, tags, gêneros, plataforma, fonte, idioma).
       - Retorna `{ game_id, game_name, articles, videos, total }[]` ordenado por `total desc`.

3. **Gerador**
   - Em `apps/web/src/reports/generators/top-games.ts`:
     - Função `generateTopGamesReport(gameCounts, { limit })` retornando top N.

4. **Dispatch em `run-report`**
   - Novo `case "top_games"`:
     - Chamar `getGameCountsForReports` na API.
     - Passar `gameCounts` para o gerador, com `limit` via `options.limit_games`.

5. **API**
   - Em `/api/reports/generate`:
     - Permitir `options.limit_games`.
     - Para `reportType === "top_games"`:
       - Carregar `gameCounts` via repositório.
       - Chamar `generateReportPayload`.

6. **Frontend**
   - `ReportsClient`:
     - Adicionar tipo “Top jogos”.
     - Campo “Limite de jogos” em `options`.
   - `reports/[id]/page.tsx`:
     - Gráfico de barras horizontais (top 10–20) + tabela.

---

### 2.3. Comparativo RSS vs YouTube (`rss_vs_youtube`)

**Objetivo:** comparar a participação de artigos (RSS) e vídeos (YouTube) em um período.

**Passos:**

1. **Tipos**
   - Em `types.ts`:
     - `RssVsYoutubePayload`:
       - `{ articles: number; videos: number; percentages: { rss: number; youtube: number } }`.

2. **Gerador**
   - Em `generators/rss-vs-youtube.ts`:
     - Recebe `articles`, `videos`.
     - Calcula totais e percentuais.

3. **Dispatch**
   - `case "rss_vs_youtube"` em `run-report`.

4. **Frontend**
   - Gráficos possíveis:
     - Pizza (participação percentual).
     - Barras lado a lado.
   - Texto explicativo para vídeos do YouTube:
     - Ex.: “X% do conteúdo é vídeo, Y% é texto”.

---

### 2.4. Timeline (`timeline`)

**Objetivo:** série temporal simples de total de publicações por dia/semana.

**Passos:**

1. **Tipos**
   - `TimelinePayload`:
     - `series: { date: string; count: number }[]`.

2. **Gerador**
   - Similar ao volume, mas com um único `count` agregando artigos + vídeos.

3. **Frontend**
   - LineChart simples com Recharts.
   - Permitir overlay de múltiplas timelines (ex.: jogo A vs jogo B) no futuro.

---

### 2.5. Resumo executivo (`executive_summary`)

**Objetivo:** página rápida para abrir na frente da câmera e comentar “como está o mercado” em 7/30/90 dias.

**Passos:**

1. **Payload sugerido**
   - `last_7_days`, `last_30_days`, `last_90_days`:
     - `{ articles, videos, rss_vs_youtube: { rssPct, youtubePct }, top_sources: [...], top_games: [...] }`.

2. **Implementação**
   - Gerador que roda internamente os outros relatórios com janelas pré-definidas.
   - Idealmente disparado por um job (cron) semanal.

3. **Frontend**
   - Card por período (7/30/90).
   - Essa página vira o “script” natural para vídeos semanais/mensais.

---

## 3. Integração com vídeos no YouTube (uso prático)

Para cada novo relatório:

- **Volume / Timeline / Atividade por dia:**  
  - Use gráficos como plano de fundo do vídeo.
  - Narre “quando” o mercado fala mais.

- **Top fontes / Top jogos / Detalhe por fonte:**  
  - Use gráficos de ranking para comentar “quem domina a conversa”.

- **Tags / temas:**  
  - Mostre as tags em alta e conecte com narrativas (“polêmicas”, “lançamentos”, “indies”, etc.).

- **RSS vs YouTube:**  
  - Conte a história “para onde a conversa migrou”.

A cada implementação técnica nova, pense em **um episódio de vídeo** que usa aquele relatório como pauta – isso ajuda a priorizar o que mais gera valor de conteúdo.

