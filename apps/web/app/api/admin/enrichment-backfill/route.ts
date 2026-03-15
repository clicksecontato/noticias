import { createContentRepository } from "../../../../../../packages/database/src/content-repository";
import { extractEntityIdsFromText } from "../../../../../../packages/database/src/enrichment";

/**
 * POST /api/admin/enrichment-backfill
 * Reaplica enriquecimento em todos os artigos e vídeos já existentes (vincula a games, tags, genres, platforms).
 * Auth: header X-Admin-Token ou Authorization: Bearer (ADMIN_INGEST_TOKEN), ou body { token }.
 */
export async function POST(request: Request): Promise<Response> {
  let body: { token?: string } = {};
  try {
    const text = await request.text();
    if (text) body = JSON.parse(text) as { token?: string };
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const token = process.env.ADMIN_INGEST_TOKEN?.trim();
  const fromHeader =
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    request.headers.get("X-Admin-Token")?.trim() ||
    "";
  const fromBody = typeof body.token === "string" ? body.token.trim() : "";
  const received = fromBody || fromHeader;

  if (!token) {
    return Response.json(
      { error: "Não autorizado. ADMIN_INGEST_TOKEN não está definido no servidor." },
      { status: 401 }
    );
  }
  if (received !== token) {
    return Response.json(
      { error: "Não autorizado. Token inválido. Use X-Admin-Token ou Authorization: Bearer." },
      { status: 401 }
    );
  }

  const repo = createContentRepository();
  let articlesProcessed = 0;
  let videosProcessed = 0;

  try {
    const catalog = await repo.getCatalogsForEnrichment();
    const [articles, videos] = await Promise.all([
      repo.getArticlesForEnrichmentBackfill(),
      repo.getYoutubeVideosForEnrichmentBackfill()
    ]);

    for (const article of articles) {
      const ids = extractEntityIdsFromText(
        article.title,
        article.excerpt.slice(0, 500),
        catalog
      );
      await repo.linkArticleToEntities(article.id, ids);
      articlesProcessed += 1;
    }

    for (const video of videos) {
      const ids = extractEntityIdsFromText(
        video.title,
        video.description.slice(0, 2000),
        catalog
      );
      await repo.linkYoutubeVideoToEntities(video.id, ids);
      videosProcessed += 1;
    }

    return Response.json({
      ok: true,
      articlesProcessed,
      videosProcessed
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Falha no backfill de enriquecimento: ${msg}` },
      { status: 500 }
    );
  }
}
