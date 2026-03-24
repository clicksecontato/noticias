# Step-by-step: RSS — link com CDATA (UOL Jogos)

## Contexto

O feed `https://rss.uol.com.br/feed/jogos.xml` envia `<link>` com conteúdo em CDATA. O parser em `extractItemLink` capturava o texto bruto e devolvia `<![CDATA[https://...]]>` como `sourceUrl`, quebrando links na UI e na base.

## Alterações

1. **`packages/scraping/src/rss-fetcher.ts`**
   - Função: `extractItemLink`.
   - Mudança: quando o `<link>` é obtido pelo match genérico (`anyLink`), o valor passa por `cleanXmlValue` (remove marcadores CDATA e faz trim), alinhado ao que já ocorre em `extractTagValue` para outros campos.
   - Utilidade: URLs corretas para feeds que embrulham o link em CDATA (UOL e outros).

2. **`packages/scraping/tests/rss-fetcher.spec.ts`**
   - Novo caso: feed estilo UOL com `<title>`, `<link>` e `<description>` em CDATA, imagem na description.
   - Utilidade: regressão garantindo `sourceUrl`, `imageUrl` e texto de resumo.

## Validação

- `npx vitest run packages/scraping/tests/rss-fetcher.spec.ts`

## Próximos passos (opcional)

- Cadastrar ou atualizar fonte no Supabase com `rss_url` = `https://rss.uol.com.br/feed/jogos.xml` e `provider` = `rss`, se ainda não existir.
