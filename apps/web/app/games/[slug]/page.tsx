import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const routeTemplate = "/games/[slug]";
export const revalidate = getRevalidateSeconds("game");

type MaybePromise<T> = T | Promise<T>;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const contentProvider = createRouteContentProvider();
  const slugs = await contentProvider.getGameSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: MaybePromise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const contentProvider = createRouteContentProvider();
  const metadataInput = await contentProvider.getGameMetadataBySlug(slug);

  return generateRouteMetadata({
    pageType: "game",
    titleBase: metadataInput.titleBase,
    descriptionBase: metadataInput.descriptionBase,
    canonicalPath: `/games/${slug}`
  });
}

export default async function GamePage({
  params
}: {
  params: MaybePromise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const contentProvider = createRouteContentProvider();
  const metadataInput = await contentProvider.getGameMetadataBySlug(slug);

  return (
    <article>
      <h2>{metadataInput.titleBase}</h2>
      <p>{metadataInput.descriptionBase}</p>
      <p style={{ opacity: 0.8 }}>Slug: /games/{slug}</p>
    </article>
  );
}
