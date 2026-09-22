# Step-by-step: filtros na Apresentação do Mês (`/admin/month-presentation`)

## Objetivo

Permitir **visões diferentes** dos mesmos dados (KPIs, gráficos, cadência, clusters, roteiro) filtrando por **provedor** (RSS / YouTube / ambos) e por **subconjunto de fontes**, sem alterar o relatório salvo no banco até nova geração em `/admin/reports`.

## Alterações

1. **`apps/web/src/reports/generators/month-presentation.ts`**
   - `MonthPresentationFilters`, `applyMonthPresentationFilters` (exportados).
   - `buildContentRowsForPeriod`, `getFilteredWindowMetrics`.
   - `generateMonthPresentationReport(periodStart, periodEnd, filters?)` aplica filtros em todo o payload (incluindo evolução mensal de 3 meses).

2. **`apps/web/app/api/admin/month-presentation/preview/route.ts`**
   - `POST` com sessão admin: body `{ periodStart, periodEnd, filters? }` → `{ payload }`.

3. **`apps/web/app/admin/month-presentation/MonthPresentationClient.tsx`**
   - Card “Filtros da apresentação”, lista de fontes (`GET /api/admin/sources`), botões Aplicar / Limpar, badge “Visão filtrada”.
   - Resumo em 30s usa números reais do `summary` atual (base ou filtrado).

4. **`apps/web/app/api/admin/reports/generate/route.ts`**
   - `filters.monthPresentation` opcional ao salvar relatório `month_presentation`.

5. **`apps/web/tests/month-presentation-filters.spec.ts`**
   - Testes unitários de `applyMonthPresentationFilters`.

## Uso

1. Gere o relatório em `/admin/reports` (tipo Apresentação mensal).
2. Em `/admin/month-presentation`, ajuste provedor e/ou marque fontes → **Aplicar filtros**.
3. **Limpar filtros** volta ao payload do último relatório concluído carregado na página.

## Validação

```bash
npx vitest run apps/web/tests/month-presentation-filters.spec.ts
```
