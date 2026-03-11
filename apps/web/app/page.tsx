import Link from "next/link";
import { createRouteContentProvider } from "../src/content-provider";
import { buildNewsQueryPath, parseNewsListParams } from "../src/news-list-query";

type MaybePromise<T> = T | Promise<T>;

export default async function HomePage({
  searchParams
}: {
  searchParams?: MaybePromise<{ page?: string; source?: string; q?: string; sort?: string }>;
}) {
  const resolvedSearchParams = parseNewsListParams(await Promise.resolve(searchParams ?? {}));
  const { page: currentPage, sourceId, query, sortMode } = resolvedSearchParams;
  const pageSize = 4;

  const provider = createRouteContentProvider();
  const [newsCards, totalNewsCards, gameCards, bestPairs, mostReadNews, sourceFilters] =
    await Promise.all([
      provider.getPaginatedNewsCards(
        currentPage,
        pageSize,
        sourceId || undefined,
        query || undefined,
        sortMode
      ),
      provider.getNewsCardsTotal(sourceId || undefined, query || undefined),
      provider.getHomeGameCards(6),
      provider.getBestGenrePlatformPairs(),
      provider.getMostReadNewsCards(5, sourceId || undefined, query || undefined, sortMode),
      provider.getNewsSourceFilters()
    ]);
  const totalPages = Math.max(1, Math.ceil(totalNewsCards / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <section>
      <div className="hero card">
        <div>
          <p className="eyebrow">Portal automatizado em pt-BR</p>
          <h2 className="heroTitle">Noticias Games</h2>
          <p className="heroText">
            Cobertura diaria de jogos, descoberta por genero e operacao manual via painel admin
            seguro.
          </p>
        </div>
        <div className="heroActions">
          <Link href="/admin" className="heroButton">
            Abrir Admin
          </Link>
          <Link href="/news/novo-trailer-de-gta-6" className="heroButton secondary">
            Ver ultima noticia
          </Link>
        </div>
      </div>

      <div className="portalGrid">
        <section>
          <h2>Noticias recentes (pagina {currentPage})</h2>
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
                <button type="submit">Buscar</button>
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
              <div className="newsThumb" aria-hidden="true" />
              <h3>
                <Link href={`/news/${card.slug}`}>{card.title}</Link>
              </h3>
              <p>{card.summary}</p>
              <small style={{ opacity: 0.75 }}>Fonte: {card.sourceName}</small>
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
                  basePath: "/"
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
                  basePath: "/"
                })}
              >
                Proxima pagina
              </Link>
            ) : (
              <span className="chip muted">Proxima pagina</span>
            )}
          </div>
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

          <h2>Descubra por categoria</h2>
          <div className="card">
            <p style={{ marginTop: 0 }}>Combinações populares de gênero e plataforma:</p>
            <div className="chipList">
              {bestPairs.slice(0, 8).map((pair) => (
                <Link
                  key={`${pair.genre}-${pair.platform}`}
                  className="chip"
                  href={`/best/${pair.genre}/${pair.platform}`}
                >
                  {pair.genre} / {pair.platform}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section>
        <h2>Jogos em destaque</h2>
        <div className="gameGrid">
          {gameCards.map((card) => (
            <article className="card" key={card.slug}>
              <h3>
                <Link href={`/games/${card.slug}`}>{card.title}</Link>
              </h3>
              <p>{card.summary}</p>
              <Link href={`/games-like/${card.slug}`}>Ver jogos parecidos</Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
