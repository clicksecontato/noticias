# Step-by-step: RSS — última semana por fonte + deduplicação existente

## Objetivo

Ingerir **todos os itens do feed com `pubDate` nos últimos 7 dias** (por fonte), até **500 itens** por feed (teto de segurança), em vez dos 6 itens anteriores. Duplicatas continuam tratadas pelo repositório: consulta em `article_sources` por `(source_id, source_url)` antes de criar artigo.

## Arquivos alterados

| Arquivo | Função |
|---------|--------|
| `packages/scraping/src/rss-fetcher.ts` | Parse de `pubDate` (RFC822, meses PT); janela `maxAgeDays` (padrão 7); `maxItems` (padrão 500, máx. 2000); `publishedAt` ISO no item; export `parseRssPubDateToMillis` para testes. |
| `packages/scraping/src/ingestion-orchestrator.ts` | `RawNewsItem.publishedAt` opcional. |
| `packages/scraping/src/fetchers/rss-content-fetcher.ts` | `rssParse` em deps para sobrescrever janela/itens em testes; repassa opções ao fetcher RSS. |
| `packages/scraping/src/persisters/article-content-persister.ts` | Repassa `publishedAt` ao repositório. |
| `packages/database/src/content-repository.ts` | `saveIngestedNewsItems` aceita `publishedAt`; memória e Supabase gravam `published_at` quando válido. |
| `apps/web/src/content-ingestion.ts` | Map inclui `publishedAt` na persistência. |
| `apps/web/src/manual-ingestion.ts` | Idem para ingestão manual legada. |
| `packages/scraping/tests/rss-fetcher.spec.ts` | Testes de parse PT, filtro de data e `maxItems`. |
| `packages/scraping/tests/rss-content-fetcher.spec.ts` | `rssParse.maxAgeDays: false` em fixtures com datas fixas; assert de `publishedAt` parseado. |
| `packages/scraping/tests/article-content-persister.spec.ts` | Expectativa de `publishedAt` no payload. |

## Regras de negócio

- **Sem `pubDate` ou parse falho:** o item **não é excluído** pela janela de 7 dias (comportamento conservador).
- **Dedup:** inalterado — mesmo `source_id` + `source_url` → `skipped` / `skippedItems`.
- **Produção:** `createContentFetcher("rss", {})` usa padrão 7 dias e 500 itens. Testes unitários do fetcher RSS usam `rssParse: { maxAgeDays: false }` quando o XML tem datas fora da janela.

## Validação

```bash
npx vitest run packages/scraping/tests packages/database/tests/content-repository.spec.ts
```

## Uso operacional

Rodar ingestão admin (todas as fontes ou selecionadas) como hoje: cada execução busca até 500 entradas **dos últimos 7 dias** por feed RSS; URLs já cadastradas são ignoradas pelas regras atuais.
