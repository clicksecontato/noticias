import Link from "next/link";
import { createRouteContentProvider } from "../../src/content-provider";
import { FilterChipRow } from "../components/FilterChipRow";
import { PageBackLink } from "../components/PageBackLink";
import { PaginationNav } from "../components/PaginationNav";
import { SectionHeader } from "../components/SectionHeader";
import { VideoCard } from "../components/VideoCard";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

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
    "Vídeos sobre inteligência artificial dos nossos canais parceiros no YouTube.",
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; source?: string }>;
}) {
  const resolved = parseVideosParams((await searchParams) ?? {});
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
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <section className="space-y-6">
      <PageBackLink href="/">Início</PageBackLink>
      <SectionHeader
        level="page"
        title="Vídeos de IA"
        description="Vídeos dos nossos canais parceiros no YouTube."
      />

      <Card className="border-border/80 shadow-sm">
        <CardContent className="pt-4">
          <p className="mb-2 text-sm font-medium text-muted-foreground">Canal</p>
          <FilterChipRow
            items={filters}
            activeId={sourceId || null}
            buildHref={(id) => buildVideosPath(1, id)}
          />
        </CardContent>
      </Card>

      {videos.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="px-6 py-10 text-center">
            <p className="mb-4 text-muted-foreground">
              Nenhum vídeo encontrado. Use Atualizar Fontes no admin para popular esta seção.
            </p>
            <Link href="/videos" className={buttonVariants({ variant: "default" })}>
              Ver todos
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <PaginationNav
        prevPage={prevPage}
        nextPage={nextPage}
        currentPage={currentPage}
        totalPages={totalPages}
        buildPrevHref={() => buildVideosPath(prevPage!, sourceId)}
        buildNextHref={() => buildVideosPath(nextPage!, sourceId)}
      />
    </section>
  );
}
