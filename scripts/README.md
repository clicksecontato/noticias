# Scripts

## add-sources.js

Adiciona na base (via API) a lista de portais brasileiros de notícias de games para RSS/scraping.

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

A lista está em **sources-list.js**. Cada item tem: `id`, `name`, `base_url`, `rss_url`.  
Se algum feed não funcionar (404 ou formato inválido), ajuste o `rss_url` em `sources-list.js` e rode de novo, ou altere depois pelo admin/API.

### Observação

Alguns portais podem não expor RSS ou usar URLs diferentes. Após rodar o script, vale testar a ingestão pelo painel admin e, se necessário, corrigir as URLs das fontes que falharem.
