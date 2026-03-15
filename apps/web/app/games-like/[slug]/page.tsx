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
  const titleBase = `Jogos como ${slug.replace(/-/g, " ")}`;

  return generateRouteMetadata({
    pageType: "games-like",
    titleBase,
    descriptionBase: `Descubra jogos parecidos com ${slug.replace(/-/g, " ")}, com foco em mecanicas, estilo e experiencia de gameplay.`,
    canonicalPath: `/games-like/${slug}`
  });
}

export default async function GamesLikePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
