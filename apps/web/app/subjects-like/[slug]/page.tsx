import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

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
  const titleBase = `Assuntos como ${slug.replace(/-/g, " ")}`;

  return generateRouteMetadata({
    pageType: "subjects-like",
    titleBase,
    descriptionBase: `Descubra assuntos parecidos com ${slug.replace(/-/g, " ")}, com foco em temas, estilo e contexto relacionados.`,
    canonicalPath: `/subjects-like/${slug}`
  });
}

export default async function SubjectsLikePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const titleBase = `Assuntos como ${slug.replace(/-/g, " ")}`;

  return (
    <section>
      <h2>{titleBase}</h2>
      <p>
        Descubra assuntos parecidos com este título, com foco em temas, estilo e
        contexto relacionados.
      </p>
    </section>
  );
}
