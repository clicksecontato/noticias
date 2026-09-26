import { createClient } from "../../../../src/lib/supabase/server";
import { runYoutubeMetadataBackfill } from "../../../../src/admin/youtube-metadata-backfill-service";

/**
 * POST /api/admin/youtube-metadata-backfill
 * Preenche duração, tags do criador, idioma, legenda, tópicos e categoria
 * nos vídeos já salvos. Não cria vídeos nem altera a ingestão.
 */
export async function POST(request: Request): Promise<Response> {
  let body: { token?: string } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as { token?: string };
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  let authorizedBySession = false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    authorizedBySession = !!user;
  } catch {
    // ignora erro de sessão; seguirá com validação por token
  }

  const token = process.env.ADMIN_INGEST_TOKEN?.trim();
  const fromHeader =
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.headers.get("X-Admin-Token")?.trim() ||
    "";
  const fromBody = typeof body.token === "string" ? body.token.trim() : "";
  const validToken = !!token && (fromBody === token || fromHeader === token);

  if (!authorizedBySession && !validToken) {
    return Response.json(
      { error: "Não autorizado. Faça login no admin ou use X-Admin-Token." },
      { status: 401 }
    );
  }

  try {
    const result = await runYoutubeMetadataBackfill();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
