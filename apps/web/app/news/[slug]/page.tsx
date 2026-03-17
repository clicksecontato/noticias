import Link from "next/link";
import { notFound } from "next/navigation";
import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";
import { EntityChips } from "../../components/EntityChips";
import { PageBackLink } from "../../components/PageBackLink";
import { classifyMediaUrl } from "../../../src/media-utils";

export const revalidate = 900;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const contentProvider = createRouteContentProvider();
  const slugs = await contentProvider.getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  const article = await contentProvider.getNewsArticleBySlug(slug);
  if (!article) {
    return { title: "Not found" };
  }
  return generateRouteMetadata({
    pageType: "news",
    titleBase: article.title,
    descriptionBase: article.summary,
    canonicalPath: `/news/${slug}`,
  });
}

function formatPublishedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  const article = await contentProvider.getNewsArticleBySlug(slug);
  if (!article) {
    notFound();
  }
  const media = classifyMediaUrl(article.imageUrl);

  return (
    <article className="space-y-6">
      <PageBackLink href="/news">← Voltar às notícias</PageBackLink>

      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">{article.sourceName}</p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">
          {article.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {formatPublishedAt(article.publishedAt)}
        </p>
        <EntityChips
          gameNames={article.gameNames}
          tagNames={article.tagNames}
          genreNames={article.genreNames}
          platformNames={article.platformNames}
        />
      </header>

      {media?.kind === "image" ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src={media.url}
            alt=""
            className="h-auto w-full object-cover"
            width={720}
            height={405}
          />
        </div>
      ) : media?.kind === "video" ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="aspect-video w-full overflow-hidden bg-black">
            <iframe
              src={media.url}
              title={article.title}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}

      {article.summary ? (
        <p className="text-lg text-muted-foreground">{article.summary}</p>
      ) : null}

      {article.sourceUrl ? (
        <p>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Leia no {article.sourceName} →
          </a>
        </p>
      ) : null}

      {article.contentHtml ? (
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      ) : null}
    </article>
  );
}
