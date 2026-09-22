# Step-by-step: relevância is_news na apresentação mensal (2026-04-02)

## Objetivo

Incluir no relatório `month_presentation` e na página `/admin/month-presentation` a distinção entre itens **relevantes para o hub** (`is_news === true`) e **genéricos/off-topic** (`is_news === false`), com totais por canal (RSS / YouTube / combinado) e **por fonte** (volume e % relevantes).

## Arquivos alterados

### `apps/web/src/reports/generators/month-presentation.ts`

- **Função:** gerador principal da apresentação mensal (Supabase).
- **Alterações:**
  - Novos tipos exportados: `MonthPresentationNewsRelevance` e campo opcional `news_relevance` em `MonthPresentationPayload` (relatórios antigos sem o campo continuam válidos).
  - `fetchAllArticleRowsWithNews` / `fetchAllVideoRowsWithNews`: leem **todos** os registros do período **sem** filtrar `is_news` (o pipeline editorial existente continua usando apenas `is_news = true` em `fetchArticleRows` / `fetchVideoRows`).
  - `buildRelevanceRowsForPeriod`: monta linhas com `source_id` (RSS via `article_sources`, YouTube na própria tabela) e `is_news`.
  - `applyRelevanceRowFilters`: aplica os mesmos `MonthPresentationFilters` (provedor + `sourceIds`) às linhas de relevância; artigos sem `source_id` são excluídos quando há filtro por fontes.
  - `buildNewsRelevancePayload` (exportada): agregação pura para totais e `by_source` (top 50 por volume + linha sintética `__unmapped_articles__` para RSS sem vínculo em `article_sources`).
  - `generateMonthPresentationReport`: executa `buildContentRowsForPeriod` e `buildRelevanceRowsForPeriod` em **paralelo** (`Promise.all`), calcula `news_relevance` e adiciona ao **roteiro** (`script`) o bloco **“Relevância: games vs genérico (is_news)”**.

### `apps/web/app/admin/month-presentation/MonthPresentationClient.tsx`

- **Função:** UI da apresentação mensal no admin.
- **Alterações:** interface local alinhada ao payload; card **“Relevância: games vs genérico (is_news)”** com três KPIs (RSS / YouTube / combinado), gráfico de barras empilhadas e tabela por fonte; mensagem para regenerar relatório quando `news_relevance` estiver ausente.

### `apps/web/tests/month-presentation-news-relevance.spec.ts`

- **Função:** testes unitários da agregação `buildNewsRelevancePayload` (cenário completo + artigos sem fonte).

## Validação

- `npx vitest run apps/web/tests/month-presentation-news-relevance.spec.ts` — OK.
- Suíte completa `npm test`: 1 suite pré-existente falha (`page-routes.spec.ts` / resolução `@/components/ui/badge`), não relacionada a esta mudança.

## Manutenibilidade

A relevância fica **desacoplada** do recorte “só notícias” usado nos gráficos editoriais: queries separadas evitam misturar semântica. A agregação exportada permite evoluir regras (ex.: tratamento de `is_news` nulo) sem tocar na UI. **Próximo passo opcional:** alinhar `monthly_evolution` ao mesmo universo “todos os itens” se o produto quiser evolução de relevância mês a mês (hoje continua baseada só em conteúdos `is_news = true`).
