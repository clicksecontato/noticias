import Link from "next/link";
import { createRouteContentProvider } from "../src/content-provider";
import { buildNewsQueryPath, parseNewsListParams } from "../src/news-list-query";
import { EntityChips } from "./components/EntityChips";
import { FilterChipRow } from "./components/FilterChipRow";
import { HeroSection } from "./components/HeroSection";
import { NewsCard } from "./components/NewsCard";
import { PaginationNav } from "./components/PaginationNav";
import { SearchForm } from "./components/SearchForm";
import { SortChips } from "./components/SortChips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  description:
    "Portal de notícias de games. Cobertura das principais fontes, com busca e filtro por fonte.",
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
        title="Notícias Games"
        description="Cobertura de jogos: notícias recentes das principais fontes, com busca e filtro por fonte."
        ctaHref="/news"
        ctaLabel="Ver todas as notícias"
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Notícias recentes (página {currentPage})
          </h2>
          <Card className="mb-6">
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
              <p className="text-sm font-medium text-muted-foreground">Ordenação:</p>
              <SortChips
                currentSort={sortMode}
                buildHref={(sort) => buildQueryPath(1, sourceId ?? "", sort)}
              />
              <p className="text-sm font-medium text-muted-foreground">Filtrar por fonte:</p>
              <FilterChipRow
                items={sourceFilters}
                activeId={sourceId || null}
                buildHref={(id) => buildQueryPath(1, id, sortMode)}
                allLabel="Todas as fontes"
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
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

        <aside>
          <h2 className="mb-4 text-xl font-semibold">Mais lidas</h2>
          <Card>
            <CardContent className="pt-4">
              <ol className="list-inside list-decimal space-y-2 text-sm">
                {mostReadNews.map((card) => (
                  <li key={card.slug}>
                    <Link
                      href={`/news/${card.slug}`}
                      className="text-foreground hover:underline"
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
