import Link from "next/link";
import { notFound } from "next/navigation";
import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";
import { EntityChips } from "../../components/EntityChips";

export const routeTemplate = "/news/[slug]";
export const revalidate = getRevalidateSeconds("news");

type MaybePromise<T> = T | Promise<T>;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const contentProvider = createRouteContentProvider();
  const slugs = await contentProvider.getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: MaybePromise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const contentProvider = createRouteContentProvider();
  const article = await contentProvider.getNewsArticleBySlug(slug);
  if (!article) {
    return { title: "Not found" };
  }
  return generateRouteMetadata({
    pageType: "news",
    titleBase: article.title,
    descriptionBase: article.summary,
    canonicalPath: `/news/${slug}`
  });
}

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

export default async function NewsPage({
  params
}: {
  params: MaybePromise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const contentProvider = createRouteContentProvider();
  const article = await contentProvider.getNewsArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  return (
    <article className="news-article">
      <p className="page-back">
        <Link href="/news">← Voltar às notícias</Link>
      </p>
      <header className="news-article__header">
        <p className="eyebrow">{article.sourceName}</p>
        <h1 className="news-article__title">{article.title}</h1>
        <p className="news-article__meta">
          {formatPublishedAt(article.publishedAt)}
        </p>
        <EntityChips
          gameNames={article.gameNames}
          tagNames={article.tagNames}
          genreNames={article.genreNames}
          platformNames={article.platformNames}
        />
      </header>
      {article.imageUrl ? (
        <div className="news-article__imageWrap">
          <img
            src={article.imageUrl}
            alt=""
            className="news-article__image"
            width={720}
            height={405}
          />
        </div>
      ) : null}
      {article.summary && (
        <p className="news-article__summary">{article.summary}</p>
      )}
      {article.sourceUrl ? (
        <p className="news-article__cta">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="news-article__read-more"
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
