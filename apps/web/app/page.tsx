import Link from "next/link";
import { createRouteContentProvider } from "../src/content-provider";
import { buildNewsQueryPath, parseNewsListParams } from "../src/news-list-query";
import { FilterChipRow } from "./components/FilterChipRow";
import { HeroSection } from "./components/HeroSection";
import { NewsCard } from "./components/NewsCard";
import { PaginationNav } from "./components/PaginationNav";
import { SearchForm } from "./components/SearchForm";
import { SectionHeader } from "./components/SectionHeader";
import { SortChips } from "./components/SortChips";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata = {
  description:
    "Portal de notícias de inteligência artificial. Cobertura das principais fontes, com busca e filtro por fonte.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; source?: string; q?: string; sort?: string }>;
}) {
  const resolvedSearchParams = parseNewsListParams((await searchParams) ?? {});
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
    provider.getNewsSourceFilters(),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalNewsCards / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const buildQueryPath = (page: number, source: string, sort: typeof sortMode) =>
    buildNewsQueryPath({ page, sourceId: source, query, sortMode: sort, basePath: "/" });

  return (
    <section className="space-y-8">
      <HeroSection
        title="Notícias IA"
        description="Cobertura de notícias recentes sobre inteligência artificial, com busca e filtro por fonte."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <section className="space-y-5">
          <SectionHeader
            title={`Notícias recentes`}
            description={`Página ${currentPage} de ${totalPages}`}
            level="section"
          />
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <SearchForm
                action="/"
                query={query ?? undefined}
                hiddenFields={{
                  source: sourceId ?? "",
                  sort: sortMode,
                }}
              />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <p className="text-sm font-medium text-muted-foreground">Ordenação</p>
              <SortChips
                currentSort={sortMode}
                buildHref={(sort) => buildQueryPath(1, sourceId ?? "", sort)}
              />
              <p className="text-sm font-medium text-muted-foreground">Filtrar por fonte</p>
              <FilterChipRow
                items={sourceFilters}
                activeId={sourceId || null}
                buildHref={(id) => buildQueryPath(1, id, sortMode)}
                allLabel="Todas as fontes"
              />
            </CardContent>
          </Card>

          <div className="space-y-5">
            {newsCards.map((card) => (
              <NewsCard key={card.slug} card={card} />
            ))}
          </div>
          <PaginationNav
            prevPage={prevPage}
            nextPage={nextPage}
            currentPage={currentPage}
            totalPages={totalPages}
            buildPrevHref={() => buildQueryPath(prevPage!, sourceId ?? "", sortMode)}
            buildNextHref={() => buildQueryPath(nextPage!, sourceId ?? "", sortMode)}
          />
        </section>

        <aside className="space-y-4">
          <SectionHeader title="Mais lidas" level="section" />
          <Card className="border-border/80 shadow-sm">
            <CardContent className="pt-4">
              <ol className="space-y-3 text-sm">
                {mostReadNews.map((card, index) => (
                  <li key={card.slug} className="flex gap-3">
                    <span className="mt-0.5 w-5 shrink-0 text-xs font-semibold tabular-nums text-primary">
                      {index + 1}
                    </span>
                    <Link
                      href={`/news/${card.slug}`}
                      className="leading-snug text-foreground no-underline hover:text-primary hover:no-underline"
                    >
                      {card.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </aside>
      </div>
    </section>
  );
}
