# Step-by-step: gitignore tsbuildinfo, observabilidade da ingestão, slugs únicos

## 1. `.gitignore`

- Entrada `*.tsbuildinfo` para não versionar cache incremental do TypeScript.
- `apps/web/tsconfig.tsbuildinfo` removido do índice Git (`git rm --cached`).

## 2. Observabilidade da ingestão

- `packages/scraping/src/content-sources/types.ts`: `IngestionFetchStats`, `ContentFetchOutcome`; `PersistContentResult.fetchStats`.
- `IContentFetcher.fetch` passa a retornar `ContentFetchOutcome` (`items` + `stats`).
- `rss-fetcher.ts`: `parseRssEntries` contabiliza itens com título, filtrados por data, cortados por `maxItems`; `fetchRssItemsBySource` retorna `{ items, stats }` e log JSON `ingestion.rss.fetch` (fora de Vitest).
- `youtube-content-fetcher.ts`: stats da playlist (raw, inválidos, entregues).
- `content-ingestion-orchestrator.ts`: após persistir, anexa `fetchStats` ao resultado; logs `ingestion.source.complete` e `ingestion.source.failed`.
- `apps/web/src/content-ingestion.ts`: expõe `fetchStatsBySource` na resposta da API admin.
- `apps/web/src/api/admin-ingest-handler.ts`: tipo da resposta atualizado.
- `apps/web/app/admin/AdminIngestionClient.tsx`: bloco “Observabilidade do fetch (por fonte)”.
- `apps/web/src/manual-ingestion.ts`: adaptador que usa só `items` de `fetchRssItemsBySource`.

## 3. Colisão de slug

- `packages/database/src/content-repository.ts`: `slugFromSourceUrl`, `allocateArticleSlugMemory`, `allocateArticleSlugSupabase` (consulta `articles.slug`, sufixo hash curto).
- Preferência: slug estável a partir do último segmento da URL (≥ 4 caracteres); senão `slugify(título)`; em conflito, `base-{hash8}`.
- Repositório em memória mantém `Set` de slugs na mesma rodada.

## 4. Testes

- Ajustes em `rss-fetcher`, `rss-content-fetcher`, `youtube-content-fetcher`, `content-ingestion-orchestrator` specs.
- Novos casos em `content-repository.spec.ts` para slugs distintos e sufixo hash.

## Validação

```bash
npx vitest run packages/scraping/tests packages/database/tests/content-repository.spec.ts
```
