import Link from "next/link";
import { createRouteContentProvider } from "../../src/content-provider";
import { buildNewsQueryPath, parseNewsListParams } from "../../src/news-list-query";

type MaybePromise<T> = T | Promise<T>;

export default async function NewsListingPage({
  searchParams
}: {
  searchParams?: MaybePromise<{ page?: string; source?: string; q?: string; sort?: string }>;
}) {
  const resolvedSearchParams = parseNewsListParams(await Promise.resolve(searchParams ?? {}));
  const { page: currentPage, sourceId, query, sortMode } = resolvedSearchParams;
  const pageSize = 6;

  const provider = createRouteContentProvider();
  const [filters, total, cards] = await Promise.all([
    provider.getNewsSourceFilters(),
    provider.getNewsCardsTotal(sourceId || undefined, query || undefined),
    provider.getPaginatedNewsCards(
      currentPage,
      pageSize,
      sourceId || undefined,
      query || undefined,
      sortMode
    )
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <section>
      <h2>Noticias de Games</h2>
      <p>Listagem com paginação, busca por termo e filtro por fonte ativa.</p>

      <div className="card">
        <form action="/news" method="get" style={{ marginBottom: 12 }}>
          <input type="hidden" name="source" value={sourceId} />
          <input type="hidden" name="sort" value={sortMode} />
          <label htmlFor="q" style={{ display: "block", marginBottom: 6 }}>
            Buscar por termo
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="q"
              name="q"
              defaultValue={query}
              placeholder="Ex.: GTA, Elden Ring..."
              style={{ flex: 1 }}
            />
            <button type="submit">Buscar</button>
          </div>
        </form>

        <p style={{ marginTop: 0 }}>Ordenação:</p>
        <div className="chipList" style={{ marginBottom: 12 }}>
          <Link
            className={`chip ${sortMode === "published_desc" ? "active" : ""}`}
            href={buildNewsQueryPath({
              page: 1,
              sourceId,
              query,
              sortMode: "published_desc",
              basePath: "/news"
            })}
          >
            Mais novas
          </Link>
          <Link
            className={`chip ${sortMode === "published_asc" ? "active" : ""}`}
            href={buildNewsQueryPath({
              page: 1,
              sourceId,
              query,
              sortMode: "published_asc",
              basePath: "/news"
            })}
          >
            Mais antigas
          </Link>
        </div>

        <p style={{ marginTop: 0 }}>Filtrar por fonte:</p>
        <div className="chipList">
          <Link
            className={`chip ${sourceId ? "" : "active"}`}
            href={buildNewsQueryPath({
              page: 1,
              sourceId: "",
              query,
              sortMode,
              basePath: "/news"
            })}
          >
            Todas
          </Link>
          {filters.map((filter) => (
            <Link
              key={filter.id}
              className={`chip ${sourceId === filter.id ? "active" : ""}`}
              href={buildNewsQueryPath({
                page: 1,
                sourceId: filter.id,
                query,
                sortMode,
                basePath: "/news"
              })}
            >
              {filter.name}
            </Link>
          ))}
        </div>
      </div>

      {cards.map((card) => (
        <article className="card newsCard" key={card.slug}>
          <div className="newsThumb" aria-hidden="true" />
          <h3>
            <Link href={`/news/${card.slug}`}>{card.title}</Link>
          </h3>
          <p>{card.summary}</p>
          <small style={{ opacity: 0.75 }}>Fonte: {card.sourceName}</small>
          <br />
          <small style={{ opacity: 0.65 }}>
            Publicado em: {new Date(card.publishedAt).toLocaleString("pt-BR")}
          </small>
        </article>
      ))}

      <div className="pagination">
        {prevPage ? (
          <Link
            className="chip"
            href={buildNewsQueryPath({
              page: prevPage,
              sourceId,
              query,
              sortMode,
              basePath: "/news"
            })}
          >
            Pagina anterior
          </Link>
        ) : (
          <span className="chip muted">Pagina anterior</span>
        )}
        <span className="chip muted">
          {currentPage} de {totalPages}
        </span>
        {nextPage ? (
          <Link
            className="chip"
            href={buildNewsQueryPath({
              page: nextPage,
              sourceId,
              query,
              sortMode,
              basePath: "/news"
            })}
          >
            Proxima pagina
          </Link>
        ) : (
          <span className="chip muted">Proxima pagina</span>
        )}
      </div>
    </section>
  );
}
