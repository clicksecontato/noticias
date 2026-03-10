import { handleAdminIngestRequest } from "../../../../src/api/admin-ingest-handler";
import { executeManualNewsIngestion } from "../../../../src/manual-ingestion";

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as { token: string; sourceIds: string[] };

  const result = await handleAdminIngestRequest(
    body,
    { ADMIN_INGEST_TOKEN: process.env.ADMIN_INGEST_TOKEN },
    executeManualNewsIngestion
  );

  return Response.json(result.body, { status: result.status });
}
