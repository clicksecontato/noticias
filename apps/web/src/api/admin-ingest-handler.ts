export interface AdminIngestRequestBody {
  token?: string;
  sourceIds: string[];
}

export interface AdminIngestResponseBody {
  processedSourceIds: string[];
  createdArticles: number;
  /** Vídeos YouTube gravados em youtube_videos (não aparecem na listagem de notícias). */
  createdVideos?: number;
  discardedByLanguage: number;
  discardedByValidation: number;
  createdBySource: Record<string, number>;
  skippedBySource: Record<string, number>;
  skippedArticles: Array<{ sourceId: string; title: string; sourceUrl?: string }>;
  /** Fontes que falharam ao buscar (RSS/YouTube). */
  failedSources?: Record<string, string>;
}

export interface AdminIngestResponse {
  status: number;
  body: AdminIngestResponseBody;
}

export type ExecuteIngestion = (
  sourceIds: string[]
) => Promise<AdminIngestResponseBody>;

export interface AdminIngestRequestContext {
  ADMIN_INGEST_TOKEN?: string;
  /** Quando true, não exige token no body (auth já feita por sessão no middleware). */
  authorizedBySession?: boolean;
}

export async function handleAdminIngestRequest(
  request: AdminIngestRequestBody,
  context: AdminIngestRequestContext,
  executeIngestion: ExecuteIngestion
): Promise<AdminIngestResponse> {
  const authorizedBySession = context.authorizedBySession === true;
  const validToken =
    context.ADMIN_INGEST_TOKEN &&
    request.token === context.ADMIN_INGEST_TOKEN;

  if (!authorizedBySession && !validToken) {
    return {
      status: 401,
      body: {
        processedSourceIds: [],
        createdArticles: 0,
        discardedByLanguage: 0,
        discardedByValidation: 0,
        createdBySource: {},
        skippedBySource: {},
        skippedArticles: []
      }
    };
  }

  const body = await executeIngestion(request.sourceIds);
  return {
    status: 200,
    body
  };
}
