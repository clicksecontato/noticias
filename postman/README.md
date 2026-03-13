# Postman – Notícias Games (todas as rotas)

## Importar a collection

1. Abra o Postman.
2. **Import** → escolha o arquivo `Noticias-Games-API.postman_collection.json`.
3. A collection **Notícias Games - Todas as rotas** será adicionada.

## Variáveis

Ajuste as variáveis da collection (clique na collection → aba **Variables**):

| Variável      | Valor exemplo           | Descrição |
|---------------|-------------------------|-----------|
| `base_url`    | `http://localhost:3000` | URL base do app. |
| `admin_token` | (valor do `.env`)        | Mesmo valor de `ADMIN_INGEST_TOKEN` no seu `.env`. |

## O que está na collection

### API Admin (3 rotas)

- **GET Fontes (listar)** – `GET /api/admin/sources` – Lista fontes (sourceIds e sources).
- **POST Fonte (criar/atualizar)** – `POST /api/admin/sources` – Cria ou atualiza uma fonte.
- **POST Ingestão (disparar)** – `POST /api/admin/ingest-news` – Dispara ingestão RSS.

Requerem header `Authorization: Bearer {{admin_token}}` ou `X-Admin-Token: {{admin_token}}`.

### Páginas (7 rotas GET)

- **GET Home** – `/`
- **GET Home (com query)** – `/?page=1&source=&q=elden&sort=published_desc`
- **GET Notícias (listagem)** – `/news`
- **GET Notícias (com query)** – `/news?page=2&source=ign-br&q=GTA&sort=published_asc`
- **GET Notícia (artigo por slug)** – `/news/:slug` (ex.: `/news/novo-trailer-de-gta-6`)
- **GET Admin** – `/admin` (sem sessão → redirect para login)
- **GET Admin Login** – `/admin/login`

As páginas retornam HTML; úteis para smoke test ou checagem de status.

## Exemplo de body para adicionar fonte (POST Fonte)

```json
{
  "id": "meu-feed",
  "name": "Meu Feed",
  "rss_url": "https://exemplo.com/feed.xml",
  "language": "pt-BR",
  "base_url": "https://exemplo.com",
  "is_active": true,
  "trust_score": 50
}
```

`language`: `pt-BR`, `pt` ou `en-US`.
