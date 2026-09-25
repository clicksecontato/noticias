import Link from "next/link";
import { createRouteContentProvider } from "../../src/content-provider";
import {
  buildVideosQueryPath,
  parseVideosListParams,
  resolveVideosDateRange,
  toggleSourceId,
} from "../../src/videos-list-query";
import { FilterChipRow } from "../components/FilterChipRow";
import { PageBackLink } from "../components/PageBackLink";
import { PaginationNav } from "../components/PaginationNav";
import { SectionHeader } from "../components/SectionHeader";
import { VideoCard } from "../components/VideoCard";
import { VideosPeriodFilter } from "../components/VideosPeriodFilter";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Vídeos",
  description:
    "Vídeos sobre inteligência artificial dos nossos canais parceiros no YouTube.",
};

export default async function VideosPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string;
    source?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}) {
  const params = parseVideosListParams((await searchParams) ?? {});
  const { page: currentPage, sourceIds, period, dateFrom, dateTo } = params;
  const range = resolveVideosDateRange(params);
  const pageSize = 12;

  const listFilters = {
    ...(sourceIds.length > 0 && { sourceIds }),
    ...range,
  };

  const provider = createRouteContentProvider();
  const [filters, total, videos] = await Promise.all([
    provider.getYoutubeSourceFilters(),
    provider.getYoutubeVideosTotal(listFilters),
    provider.getPaginatedYoutubeVideos(currentPage, pageSize, listFilters),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const buildPath = (page: number, nextSourceIds: string[]) =>
    buildVideosQueryPath({
      page,
      sourceIds: nextSourceIds,
      period,
      dateFrom,
      dateTo,
    });

  const hasFilters = sourceIds.length > 0 || Boolean(period || dateFrom || dateTo);

  return (
    <section className="space-y-6">
      <PageBackLink href="/">Início</PageBackLink>
      <SectionHeader
        level="page"
        title="Vídeos de IA"
        description="Vídeos dos nossos canais parceiros no YouTube."
      />

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-5 pt-4">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Canal
              <span className="ml-1.5 font-normal text-muted-foreground/80">
                (seleção múltipla)
              </span>
            </p>
            <FilterChipRow
              items={filters}
              activeIds={sourceIds}
              buildHref={(id) =>
                buildPath(1, id ? toggleSourceId(sourceIds, id) : [])
              }
            />
          </div>
          <VideosPeriodFilter
            sourceIds={sourceIds}
            period={period}
            dateFrom={dateFrom}
            dateTo={dateTo}
          />
        </CardContent>
      </Card>

      {videos.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="px-6 py-10 text-center">
            <p className="mb-4 text-muted-foreground">
              {hasFilters
                ? "Nenhum vídeo com estes filtros. Ajuste canais ou período."
                : "Nenhum vídeo encontrado. Use Atualizar Fontes no admin para popular esta seção."}
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
        buildPrevHref={() => buildPath(prevPage!, sourceIds)}
        buildNextHref={() => buildPath(nextPage!, sourceIds)}
      />
    </section>
  );
}
