import Link from "next/link";
import { createRouteContentProvider } from "../../src/content-provider";
import { EntityChips } from "../components/EntityChips";

type MaybePromise<T> = T | Promise<T>;

function parseVideosParams(searchParams: { page?: string; source?: string }) {
  const pageParam = Number.parseInt(searchParams.page || "1", 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const sourceId = (searchParams.source || "").trim();
  return { page, sourceId };
}

function buildVideosPath(page: number, sourceId: string, basePath = "/videos") {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (sourceId) params.set("source", sourceId);
  return `${basePath}?${params.toString()}`;
}

export const metadata = {
  title: "Vídeos",
  description:
    "Vídeos de games dos nossos canais parceiros no YouTube. Gameplay, trailers e análises."
};

export default async function VideosPage({
  searchParams
}: {
  searchParams?: MaybePromise<{ page?: string; source?: string }>;
}) {
  const resolved = parseVideosParams(
    await Promise.resolve(searchParams ?? {})
  );
  const { page: currentPage, sourceId } = resolved;
  const pageSize = 12;

  const provider = createRouteContentProvider();
  const [filters, total, videos] = await Promise.all([
    provider.getYoutubeSourceFilters(),
    provider.getYoutubeVideosTotal(sourceId || undefined),
    provider.getPaginatedYoutubeVideos(
      currentPage,
      pageSize,
      sourceId || undefined
    )
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <section>
      <p className="page-back">
        <Link href="/">← Início</Link>
      </p>
      <h2>Vídeos de Games</h2>
      <p>Vídeos dos nossos canais parceiros no YouTube.</p>

      <div className="card">
        <p style={{ marginTop: 0 }}>Canal:</p>
        <div className="chipList">
          <Link
            className={`chip ${!sourceId ? "active" : ""}`}
            href={buildVideosPath(1, "")}
          >
            Todos
          </Link>
          {filters.map((filter) => (
            <Link
              key={filter.id}
              className={`chip ${sourceId === filter.id ? "active" : ""}`}
              href={buildVideosPath(1, filter.id)}
            >
              {filter.name}
            </Link>
          ))}
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="card empty-state">
          <p>Nenhum vídeo encontrado. Execute a ingestão de fontes YouTube no admin para popular esta seção.</p>
          <Link href="/videos" className="chip active">
            Ver todos
          </Link>
        </div>
      ) : null}

      <div
        className="videoGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
          marginTop: "1rem"
        }}
      >
        {videos.map((video) => (
          <article className="card newsCard" key={video.id}>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="newsCard-imageWrap"
              style={{ display: "block" }}
            >
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="newsCard-image"
                  width={320}
                  height={180}
                  loading="lazy"
                  style={{ width: "100%", height: "auto", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    aspectRatio: "16/9",
                    background: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b"
                  }}
                >
                  Vídeo
                </div>
              )}
            </a>
            <h3 style={{ fontSize: "1rem", marginTop: "0.5rem" }}>
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                {video.title}
              </a>
            </h3>
            {video.description ? (
              <p
                style={{
                  margin: "0.25rem 0 0",
                  fontSize: "0.875rem",
                  color: "#94a3b8",
                  lineHeight: 1.4,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {video.description}
              </p>
            ) : null}
            <small style={{ opacity: 0.75, display: "block", marginTop: "0.5rem" }}>
              {video.sourceName}
            </small>
            <small style={{ opacity: 0.65, display: "block" }}>
              {new Date(video.publishedAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              })}
            </small>
            <EntityChips
              gameNames={video.gameNames}
              tagNames={video.tagNames}
              genreNames={video.genreNames}
              platformNames={video.platformNames}
            />
          </article>
        ))}
      </div>

      <nav className="pagination" aria-label="Paginação" style={{ marginTop: "1.5rem" }}>
        {prevPage ? (
          <Link
            className="chip"
            href={buildVideosPath(prevPage, sourceId)}
            aria-label="Página anterior"
          >
            Página anterior
          </Link>
        ) : (
          <span className="chip muted" aria-hidden="true">
            Página anterior
          </span>
        )}
        <span className="chip muted" aria-live="polite">
          Página {currentPage} de {totalPages}
        </span>
        {nextPage ? (
          <Link
            className="chip"
            href={buildVideosPath(nextPage, sourceId)}
            aria-label="Próxima página"
          >
            Próxima página
          </Link>
        ) : (
          <span className="chip muted" aria-hidden="true">
            Próxima página
          </span>
        )}
      </nav>
    </section>
  );
}
