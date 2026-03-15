import Link from "next/link";
import { createRouteContentProvider } from "../src/content-provider";
import { buildNewsQueryPath, parseNewsListParams } from "../src/news-list-query";
import { EntityChips } from "./components/EntityChips";

type MaybePromise<T> = T | Promise<T>;

export const metadata = {
  description:
    "Portal de notícias de games. Cobertura das principais fontes, com busca e filtro por fonte."
};

export default async function HomePage({
  searchParams
}: {
  searchParams?: MaybePromise<{ page?: string; source?: string; q?: string; sort?: string }>;
}) {
  const resolvedSearchParams = parseNewsListParams(await Promise.resolve(searchParams ?? {}));
  const { page: currentPage, sourceId, query, sortMode } = resolvedSearchParams;
  const pageSize = 4;

  const provider = createRouteContentProvider();
  const [newsCards, totalNewsCards, mostReadNews, sourceFilters] = await Promise.all([
    provider.getPaginatedNewsCards(
      currentPage,
      pageSize,
      sourceId || undefined,
      query || undefined,
      sortMode
    ),
    provider.getNewsCardsTotal(sourceId || undefined, query || undefined),
    provider.getMostReadNewsCards(5, sourceId || undefined, query || undefined, sortMode),
    provider.getNewsSourceFilters()
  ]);
  const totalPages = Math.max(1, Math.ceil(totalNewsCards / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  function formatPublishedAt(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      });
    } catch {
      return iso;
    }
  }

  return (
    <section>
      <div className="hero card">
        <div>
          <p className="eyebrow">Portal em português brasileiro</p>
          <h2 className="heroTitle">Notícias Games</h2>
          <p className="heroText">
            Cobertura de jogos: notícias recentes das principais fontes, com busca e filtro por fonte.
          </p>
        </div>
        <Link href="/news" className="heroButton">
          Ver todas as notícias
        </Link>
      </div>

      <div className="portalGrid">
        <section>
          <h2>Notícias recentes (página {currentPage})</h2>
          <div className="card">
            <form action="/" method="get" style={{ marginBottom: 12 }}>
              <input type="hidden" name="source" value={sourceId} />
              <input type="hidden" name="sort" value={sortMode} />
              <label htmlFor="home-q" style={{ display: "block", marginBottom: 6 }}>
                Buscar por termo
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  id="home-q"
                  name="q"
                  defaultValue={query}
                  placeholder="Ex.: GTA, Elden Ring..."
                  style={{ flex: 1 }}
                />
                <button type="submit" aria-label="Buscar notícias">Buscar</button>
              </div>
            </form>

            <div className="chipList" style={{ marginBottom: 10 }}>
              <Link
                className={`chip ${sortMode === "published_desc" ? "active" : ""}`}
                href={buildNewsQueryPath({
                  page: 1,
                  sourceId,
                  query,
                  sortMode: "published_desc",
                  basePath: "/"
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
                  basePath: "/"
                })}
              >
                Mais antigas
              </Link>
            </div>

            <div className="chipList">
              <Link
                className={`chip ${sourceId ? "" : "active"}`}
                href={buildNewsQueryPath({
                  page: 1,
                  sourceId: "",
                  query,
                  sortMode,
                  basePath: "/"
                })}
              >
                Todas as fontes
              </Link>
              {sourceFilters.map((filter) => (
                <Link
                  key={filter.id}
                  className={`chip ${sourceId === filter.id ? "active" : ""}`}
                  href={buildNewsQueryPath({
                    page: 1,
                    sourceId: filter.id,
                    query,
                    sortMode,
                    basePath: "/"
                  })}
                >
                  {filter.name}
                </Link>
              ))}
            </div>
          </div>

          {newsCards.map((card) => (
            <article className="card newsCard" key={card.slug}>
              {card.imageUrl ? (
                <Link href={`/news/${card.slug}`} className="newsCard-imageWrap">
                  <img
                    src={card.imageUrl}
                    alt=""
                    className="newsCard-image"
                    width={400}
                    height={220}
                    loading="lazy"
                  />
                </Link>
              ) : null}
              <h3>
                <Link href={`/news/${card.slug}`}>{card.title}</Link>
              </h3>
              <p>{card.summary}</p>
              <small style={{ opacity: 0.75 }}>Fonte: {card.sourceName}</small>
              <br />
              <small style={{ opacity: 0.65 }}>
                Publicado em: {formatPublishedAt(card.publishedAt)}
              </small>
              <EntityChips
                gameNames={card.gameNames}
                tagNames={card.tagNames}
                genreNames={card.genreNames}
                platformNames={card.platformNames}
              />
            </article>
          ))}
          <nav className="pagination" aria-label="Paginação">
            {prevPage ? (
              <Link
                className="chip"
                href={buildNewsQueryPath({
                  page: prevPage,
                  sourceId,
                  query,
                  sortMode,
                  basePath: "/"
                })}
                aria-label="Página anterior"
              >
                Página anterior
              </Link>
            ) : (
              <span className="chip muted" aria-hidden="true">Página anterior</span>
            )}
            <span className="chip muted" aria-live="polite">
              Página {currentPage} de {totalPages}
            </span>
            {nextPage ? (
              <Link
                className="chip"
                href={buildNewsQueryPath({
                  page: nextPage,
                  sourceId,
                  query,
                  sortMode,
                  basePath: "/"
                })}
                aria-label="Próxima página"
              >
                Próxima página
              </Link>
            ) : (
              <span className="chip muted" aria-hidden="true">Próxima página</span>
            )}
          </nav>
        </section>

        <aside>
          <h2>Mais lidas</h2>
          <div className="card">
            <ol className="mostReadList">
              {mostReadNews.map((card) => (
                <li key={card.slug}>
                  <Link href={`/news/${card.slug}`}>{card.title}</Link>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </section>
  );
}
