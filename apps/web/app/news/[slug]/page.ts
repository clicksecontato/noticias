import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const routeTemplate = "/news/[slug]";
export const revalidate = getRevalidateSeconds("news");

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const contentProvider = createRouteContentProvider();
  const slugs = await contentProvider.getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  const metadataInput = await contentProvider.getNewsMetadataBySlug(slug);

  return generateRouteMetadata({
    pageType: "news",
    titleBase: metadataInput.titleBase,
    descriptionBase: metadataInput.descriptionBase,
    canonicalPath: `/news/${slug}`
  });
}
