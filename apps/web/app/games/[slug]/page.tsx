import { notFound } from "next/navigation";
import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const revalidate = 86400;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const contentProvider = createRouteContentProvider();
  const slugs = await contentProvider.getGameSlugs();
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
    metadataInput = await contentProvider.getGameMetadataBySlug(slug);
  } catch {
    notFound();
  }
  return generateRouteMetadata({
    pageType: "game",
    titleBase: metadataInput.titleBase,
    descriptionBase: metadataInput.descriptionBase,
    canonicalPath: `/games/${slug}`
  });
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  let metadataInput;
  try {
    metadataInput = await contentProvider.getGameMetadataBySlug(slug);
  } catch {
    notFound();
  }
  return (
    <article>
      <h2>{metadataInput.titleBase}</h2>
      <p>{metadataInput.descriptionBase}</p>
      <p style={{ opacity: 0.8 }}>Slug: /games/{slug}</p>
    </article>
  );
}
