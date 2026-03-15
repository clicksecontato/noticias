import { handleAdminIngestRequest } from "../../../../src/api/admin-ingest-handler";
import { executeContentIngestion } from "../../../../src/content-ingestion";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as { token: string; sourceIds: string[] };

  const result = await handleAdminIngestRequest(
    body,
    { ADMIN_INGEST_TOKEN: process.env.ADMIN_INGEST_TOKEN },
    executeContentIngestion
  );

  return Response.json(result.body, { status: result.status });
}
