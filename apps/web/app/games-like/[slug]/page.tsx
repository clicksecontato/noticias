import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const routeTemplate = "/games-like/[slug]";
export const revalidate = getRevalidateSeconds("games-like");

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
  const titleBase = `Jogos como ${slug.replace(/-/g, " ")}`;

  return generateRouteMetadata({
    pageType: "games-like",
    titleBase,
    descriptionBase: `Descubra jogos parecidos com ${slug.replace(/-/g, " ")}, com foco em mecanicas, estilo e experiencia de gameplay.`,
    canonicalPath: `/games-like/${slug}`
  });
}

export default async function GamesLikePage({
  params
}: {
  params: MaybePromise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const titleBase = `Jogos como ${slug.replace(/-/g, " ")}`;

  return (
    <section>
      <h2>{titleBase}</h2>
      <p>
        Descubra jogos parecidos com este titulo, com foco em mecanicas, estilo e
        experiencia de gameplay.
      </p>
    </section>
  );
}
