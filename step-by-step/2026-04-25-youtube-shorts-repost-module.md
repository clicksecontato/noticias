# Step-by-step: módulo YouTube Shorts (repost)

## Objetivo
Criar um módulo novo e isolado para iniciar jobs de republicação de shorts, sem alterar o fluxo existente de ingestão.

## Avanços e alterações
1. Mapeamento técnico concluído com foco em isolamento do módulo.
2. Testes criados primeiro (TDD) para parser de URL e handler de autenticação.
3. Camada de domínio criada em `apps/web/src/youtube-shorts`.
4. Camada de API criada em `/api/admin/youtube-shorts`.
5. Interface admin criada em `/admin/youtube-shorts`.
6. Persistência de jobs criada em `packages/database` com migration dedicada.

## Arquivos criados/alterados e utilidade
- `apps/web/tests/youtube-shorts-url-parser.spec.ts`
  - Valida parsing de URL `shorts`, `watch` e `youtu.be`.
- `apps/web/tests/admin-youtube-shorts-handler.spec.ts`
  - Garante regras de autorização por sessão/token para o novo endpoint.
- `apps/web/src/youtube-shorts/contracts.ts`
  - Define contratos de request/response e snapshot de vídeo.
- `apps/web/src/youtube-shorts/url-parser.ts`
  - Centraliza extração de `videoId` e canonical URL.
- `apps/web/src/youtube-shorts/youtube-source-client.ts`
  - Consulta YouTube Data API para validar vídeo e coletar metadados.
- `apps/web/src/youtube-shorts/publish-short-service.ts`
  - Orquestra criação e atualização de job no banco.
- `apps/web/src/api/admin-youtube-shorts-handler.ts`
  - Aplica autorização e contrato HTTP do módulo.
- `apps/web/app/api/admin/youtube-shorts/publish/route.ts`
  - Endpoint POST para criar e processar job.
- `apps/web/app/api/admin/youtube-shorts/jobs/[id]/route.ts`
  - Endpoint GET para consultar status persistido do job.
- `apps/web/app/admin/youtube-shorts/page.tsx`
  - Entrada da nova página admin.
- `apps/web/app/admin/youtube-shorts/YoutubeShortsClient.tsx`
  - Formulário de criação de job + consulta de status.
- `apps/web/app/admin/components/AdminSidebar.tsx` (alterado)
  - Inclui item de menu para a nova seção.
- `packages/database/src/youtube-short-publish-types.ts`
  - Tipos de domínio para jobs de republicação.
- `packages/database/src/youtube-short-publish-repository.ts`
  - Repositório Supabase/memory para persistência dos jobs.
- `packages/database/migrations/021_create_youtube_short_publish_jobs.sql`
  - Cria tabela e índices de jobs.

## Etapa 2 — download + upload real (2026-04-25)
- Com `YOUTUBE_SHORTS_REUPLOAD_ENABLED=true`, o job: valida OAuth de destino, baixa com **yt-dlp**, envia com **googleapis** (`videos.insert`), atualiza job `completed` ou `failed`, e apaga diretório temporário.
- Novos arquivos:
  - `apps/web/src/youtube-shorts/youtube-short-upload-config.ts` — leitura/validação de env (OAuth + yt-dlp + limite de tamanho).
  - `apps/web/src/youtube-shorts/youtube-media-downloader.ts` — execução de `yt-dlp` com timeout 10 min.
  - `apps/web/src/youtube-shorts/youtube-target-uploader.ts` — upload OAuth2 para o canal do refresh token.
  - `apps/web/tests/youtube-short-upload-config.spec.ts`, `youtube-media-downloader.spec.ts`, `publish-short-service.spec.ts`.
- Dependência: `googleapis` no workspace `apps/web`.
- Rota `publish`: `export const maxDuration = 300` (ajuste conforme provedor).
- Correção de import: `apps/web/src/api/admin-ingest-handler.ts` → caminho correto para `packages/scraping` (build/types).

### Variáveis de ambiente (reupload)
| Variável | Obrigatório se reupload ligado | Descrição |
|----------|----------------------------------|-----------|
| `YOUTUBE_SHORTS_REUPLOAD_ENABLED` | Sim (`true`) | Liga o pipeline completo. |
| `YOUTUBE_API_KEY` | Sim (já usada) | Metadados do vídeo de origem (`videos.list`). |
| `YOUTUBE_OAUTH_CLIENT_ID` | Sim | OAuth app Google (tipo Web ou Desktop). |
| `YOUTUBE_OAUTH_CLIENT_SECRET` | Sim | Segredo do cliente OAuth. |
| `YOUTUBE_REFRESH_TOKEN` | Sim | Token da conta/canal que receberá o upload; escopo `youtube.upload`. |
| `YOUTUBE_OAUTH_REDIRECT_URI` | Não | Padrão `http://localhost:3000` (deve bater com o usado ao gerar o refresh token). |
| `YT_DLP_PATH` | Não | Padrão `yt-dlp` — binário no PATH ou caminho absoluto. |
| `YOUTUBE_SHORT_MAX_DOWNLOAD_BYTES` | Não | Padrão 500 MB; usado para `--max-filesize` no yt-dlp. |

**Pré-requisitos no servidor:** `yt-dlp` instalado e acessível; disco temporário suficiente; credenciais OAuth com escopo de upload no YouTube.

## Estado atual
- Com flag e credenciais corretas, o reenvio para o canal do **refresh token** pode ser testado de ponta a ponta.
- Sem flag ou sem OAuth/yt-dlp, o job falha com mensagem explícita.

## Validação executada
- Testes focados do módulo (incl. `publish-short-service.spec.ts`, `youtube-short-upload-config.spec.ts`, `youtube-media-downloader.spec.ts`): ✅
- Build web `npm run build:web`: ❌ falha de tipo em `packages/database/src/content-repository.ts` (SupabaseClient genérico), fora deste módulo.
