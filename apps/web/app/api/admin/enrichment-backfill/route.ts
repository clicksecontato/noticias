import { createClient } from "../../../../src/lib/supabase/server";
import { createContentRepository, type EntityIds } from "../../../../../../packages/database/src/content-repository";
import { extractEntityIdsFromText } from "../../../../../../packages/database/src/enrichment";
import { extractEntitiesWithGemini, isEnrichmentAiEnabled } from "../../../../../../packages/database/src/enrichment-ai";

/**
 * POST /api/admin/enrichment-backfill
 * Reaplica enriquecimento em todos os artigos e vídeos já existentes.
 * Auth: sessão Supabase (painel) ou header X-Admin-Token / Authorization Bearer (ADMIN_INGEST_TOKEN).
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
    const { data: { user } } = await supabase.auth.getUser();
    authorizedBySession = !!user;
  } catch {
    // ignora
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

  const repo = createContentRepository();
  let articlesProcessed = 0;
  let videosProcessed = 0;

  try {
    const catalog = await repo.getCatalogsForEnrichment();
    const [articles, videos] = await Promise.all([
      repo.getArticlesForEnrichmentBackfill(),
      repo.getYoutubeVideosForEnrichmentBackfill()
    ]);

    const useAi = isEnrichmentAiEnabled();

    for (const article of articles) {
      let ids: EntityIds;
      if (useAi) {
        try {
          const suggested = await extractEntitiesWithGemini(article.title, article.excerpt.slice(0, 500));
          ids = await repo.resolveOrCreateEntityIds(suggested);
          const fromText = extractEntityIdsFromText(article.title, article.excerpt.slice(0, 500), catalog);
          ids = {
            gameIds: [...new Set([...ids.gameIds, ...fromText.gameIds])],
            tagIds: [...new Set([...ids.tagIds, ...fromText.tagIds])],
            genreIds: [...new Set([...ids.genreIds, ...fromText.genreIds])],
            platformIds: [...new Set([...ids.platformIds, ...fromText.platformIds])]
          };
        } catch {
          ids = extractEntityIdsFromText(article.title, article.excerpt.slice(0, 500), catalog);
        }
      } else {
        ids = extractEntityIdsFromText(article.title, article.excerpt.slice(0, 500), catalog);
      }
      await repo.linkArticleToEntities(article.id, ids);
      articlesProcessed += 1;
    }

    for (const video of videos) {
      let ids: EntityIds;
      if (useAi) {
        try {
          const suggested = await extractEntitiesWithGemini(video.title, video.description.slice(0, 2000));
          ids = await repo.resolveOrCreateEntityIds(suggested);
          const fromText = extractEntityIdsFromText(video.title, video.description.slice(0, 2000), catalog);
          ids = {
            gameIds: [...new Set([...ids.gameIds, ...fromText.gameIds])],
            tagIds: [...new Set([...ids.tagIds, ...fromText.tagIds])],
            genreIds: [...new Set([...ids.genreIds, ...fromText.genreIds])],
            platformIds: [...new Set([...ids.platformIds, ...fromText.platformIds])]
          };
        } catch {
          ids = extractEntityIdsFromText(video.title, video.description.slice(0, 2000), catalog);
        }
      } else {
        ids = extractEntityIdsFromText(video.title, video.description.slice(0, 2000), catalog);
      }
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
