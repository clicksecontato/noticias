import { notFound } from "next/navigation";
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
  return (
    <article>
      <h2>{metadataInput.titleBase}</h2>
      <p>{metadataInput.descriptionBase}</p>
      <p style={{ opacity: 0.8 }}>Slug: /subjects/{slug}</p>
    </article>
  );
}
