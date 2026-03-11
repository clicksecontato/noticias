export interface AdminIngestRequestBody {
  token: string;
  sourceIds: string[];
}

export interface AdminIngestResponseBody {
  processedSourceIds: string[];
  createdArticles: number;
  discardedByLanguage: number;
  discardedByValidation: number;
  createdBySource: Record<string, number>;
  skippedBySource: Record<string, number>;
  skippedArticles: Array<{ sourceId: string; title: string; sourceUrl?: string }>;
}

export interface AdminIngestResponse {
  status: number;
  body: AdminIngestResponseBody;
}

export type ExecuteIngestion = (
  sourceIds: string[]
) => Promise<AdminIngestResponseBody>;

export async function handleAdminIngestRequest(
  request: AdminIngestRequestBody,
  env: { ADMIN_INGEST_TOKEN?: string },
  executeIngestion: ExecuteIngestion
): Promise<AdminIngestResponse> {
  if (!env.ADMIN_INGEST_TOKEN || request.token !== env.ADMIN_INGEST_TOKEN) {
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
