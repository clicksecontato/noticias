import Link from "next/link";
import { createRouteContentProvider } from "../../src/content-provider";
import { buildNewsQueryPath, parseNewsListParams } from "../../src/news-list-query";
import { FilterChipRow } from "../components/FilterChipRow";
import { NewsCard } from "../components/NewsCard";
import { PageBackLink } from "../components/PageBackLink";
import { PaginationNav } from "../components/PaginationNav";
import { SearchForm } from "../components/SearchForm";
import { SectionHeader } from "../components/SectionHeader";
import { SortChips } from "../components/SortChips";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Notícias",
  description:
    "Listagem de notícias de inteligência artificial em português brasileiro. Paginação, busca por termo e filtro por fonte.",
};

export default async function NewsListingPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; source?: string; q?: string; sort?: string }>;
}) {
  const resolvedSearchParams = parseNewsListParams((await searchParams) ?? {});
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
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = currentPage > 1 ? currentPage - 1 : null;
  const nextPage = currentPage < totalPages ? currentPage + 1 : null;

  const buildQueryPath = (page: number, source: string, sort: typeof sortMode) =>
    buildNewsQueryPath({ page, sourceId: source, query, sortMode: sort, basePath: "/news" });

  return (
    <section className="space-y-6">
      <PageBackLink href="/">Início</PageBackLink>
      <SectionHeader
        level="page"
        title="Notícias de IA"
        description="Listagem com paginação, busca por termo e filtro por fonte."
      />

      <Card className="border-border/80 shadow-sm">
        <CardContent className="space-y-4 pt-4">
          <SearchForm
            action="/news"
            query={query ?? undefined}
            hiddenFields={{ source: sourceId ?? "", sort: sortMode }}
          />
          <p className="text-sm font-medium text-muted-foreground">Ordenação</p>
          <SortChips
            currentSort={sortMode}
            buildHref={(sort) => buildQueryPath(1, sourceId ?? "", sort)}
          />
          <p className="text-sm font-medium text-muted-foreground">Filtrar por fonte</p>
          <FilterChipRow
            items={filters}
            activeId={sourceId || null}
            buildHref={(id) => buildQueryPath(1, id, sortMode)}
          />
        </CardContent>
      </Card>

      {cards.length === 0 ? (
        <Card className="border-dashed border-border/80">
          <CardContent className="px-6 py-10 text-center">
            <p className="mb-4 text-muted-foreground">
              Nenhuma notícia encontrada com os filtros atuais.
            </p>
            <Link href="/news" className={buttonVariants({ variant: "default" })}>
              Limpar filtros
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-5">
        {cards.map((card) => (
          <NewsCard
            key={card.slug}
            card={card}
            formatDate={(iso) => new Date(iso).toLocaleString("pt-BR")}
          />
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
  );
}
