import { notFound } from "next/navigation";
import Link from "next/link";
import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";
import { NewsCard } from "../../components/NewsCard";
import { PageBackLink } from "../../components/PageBackLink";
import { VideoCard } from "../../components/VideoCard";
import { buttonVariants } from "@/components/ui/button";

export const revalidate = 86400;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const contentProvider = createRouteContentProvider();
  const slugs = await contentProvider.getSubjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  let metadataInput;
  try {
    metadataInput = await contentProvider.getSubjectMetadataBySlug(slug);
  } catch {
    notFound();
  }
  return generateRouteMetadata({
    pageType: "subject",
    titleBase: metadataInput.titleBase,
    descriptionBase: metadataInput.descriptionBase,
    canonicalPath: `/subjects/${slug}`
  });
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  let metadataInput;
  try {
    metadataInput = await contentProvider.getSubjectMetadataBySlug(slug);
  } catch {
    notFound();
  }

  const [newsCards, videoCards] = await Promise.all([
    contentProvider.getNewsCardsForSubjectSlug(slug, 12),
    contentProvider.getYoutubeVideosForSubjectSlug(slug, 6),
  ]);

  return (
    <article className="space-y-8">
      <PageBackLink href="/news">← Notícias</PageBackLink>

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{metadataInput.titleBase}</h1>
        <p className="text-muted-foreground">{metadataInput.descriptionBase}</p>
        <p className="text-sm text-muted-foreground">
          <Link href={`/subjects-like/${slug}`} className={buttonVariants({ variant: "link", className: "h-auto p-0" })}>
            Ver assuntos relacionados
          </Link>
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Notícias relacionadas</h2>
        {newsCards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há notícias vinculadas a este assunto. Após a ingestão e o enriquecimento, elas aparecem aqui.
          </p>
        ) : (
          <div className="grid gap-4">
            {newsCards.map((card) => (
              <NewsCard key={card.slug} card={card} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Vídeos relacionados</h2>
        {videoCards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ainda não há vídeos vinculados a este assunto.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {videoCards.map((card) => (
              <VideoCard key={card.id} video={card} />
            ))}
          </div>
        )}
      </section>
    </article>
  );
}
