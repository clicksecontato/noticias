import { createContentRepository } from "../../../../../packages/database/src/content-repository";

/**
 * GET /api/catalogs
 * Retorna jogos, tags, gêneros e plataformas para filtros de relatórios e enriquecimento.
 */
export async function GET(): Promise<Response> {
  try {
    const repo = createContentRepository();
    const catalog = await repo.getCatalogsForEnrichment();
    return Response.json({
      games: catalog.games,
      tags: catalog.tags,
      genres: catalog.genres,
      platforms: catalog.platforms
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Falha ao carregar catálogos: ${msg}` },
      { status: 500 }
    );
  }
}
