import { createContentRepository } from "../../../../../packages/database/src/content-repository";

/**
 * GET /api/catalogs
 * Retorna assuntos, tags e tipos para filtros de relatórios e enriquecimento.
 */
export async function GET(): Promise<Response> {
  try {
    const repo = createContentRepository();
    const catalog = await repo.getCatalogsForEnrichment();
    return Response.json({
      subjects: catalog.subjects,
      tags: catalog.tags,
      types: catalog.types
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Falha ao carregar catálogos: ${msg}` },
      { status: 500 }
    );
  }
}
