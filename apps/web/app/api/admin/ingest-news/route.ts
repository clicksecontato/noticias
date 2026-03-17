import { createClient } from "../../../../src/lib/supabase/server";
import { handleAdminIngestRequest } from "../../../../src/api/admin-ingest-handler";
import { executeContentIngestion } from "../../../../src/content-ingestion";

export async function POST(request: Request): Promise<Response> {
  let body: { token?: string; sourceIds: string[] } = { sourceIds: [] };
  try {
    const parsed = await request.json();
    body = {
      sourceIds: Array.isArray(parsed?.sourceIds) ? parsed.sourceIds : [],
      token: typeof parsed?.token === "string" ? parsed.token : undefined,
    };
  } catch {
    return Response.json(
      { error: "Body inválido. Envie { sourceIds: string[] }." },
      { status: 400 }
    );
  }

  let authorizedBySession = false;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    authorizedBySession = !!user;
  } catch {
    // ignora erro de sessão; seguirá com validação por token
  }

  const result = await handleAdminIngestRequest(
    body,
    {
      ADMIN_INGEST_TOKEN: process.env.ADMIN_INGEST_TOKEN,
      authorizedBySession,
    },
    executeContentIngestion
  );

  return Response.json(result.body, { status: result.status });
}
