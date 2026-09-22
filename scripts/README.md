# Scripts

## add-sources.js

Adiciona na base (via API) a lista de portais de notícias de **tech/IA** (pt-BR) para RSS/scraping.

### Pré-requisitos

- Aplicação rodando (ex.: `npm run dev`) ou API acessível em `BASE_URL`.
- Variáveis de ambiente:
  - **ADMIN_INGEST_TOKEN** – mesmo valor do `.env` (obrigatório).
  - **BASE_URL** – URL base do app (ex.: `http://localhost:3000`). Opcional; padrão: `http://localhost:3000`.

### Uso

```bash
# Com variáveis inline
BASE_URL=http://localhost:3000 ADMIN_INGEST_TOKEN=seu_token npm run add-sources

# Ou exporte antes
export ADMIN_INGEST_TOKEN=seu_token
export BASE_URL=http://localhost:3000
npm run add-sources
```

Ou execute direto:

```bash
node scripts/add-sources.js
```

(Defina `ADMIN_INGEST_TOKEN` e, se precisar, `BASE_URL` no ambiente.)

### Lista de fontes

A lista está em **sources-list.js**. Cada item tem: `id`, `name`, `base_url`, `rss_url`, `language`.  
A ingestão atual só processa fontes `pt-BR`/`pt`.  
Se algum feed não funcionar (404 ou formato inválido), ajuste o `rss_url` e rode de novo, ou altere pelo admin/API.

### Observação

Após a migration `023`, o catálogo e as fontes de IA já podem estar no banco. O script serve para reaplicar/atualizar a lista via API.
