import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../../src/publishing";
import { createRouteContentProvider } from "../../../../src/content-provider";

export const routeTemplate = "/best/[genre]/[platform]";
export const revalidate = getRevalidateSeconds("best");

export async function generateStaticParams(): Promise<
  Array<{ genre: string; platform: string }>
> {
  const contentProvider = createRouteContentProvider();
  return await contentProvider.getBestGenrePlatformPairs();
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ genre: string; platform: string }>;
}) {
  const { genre, platform } = await params;
  const genreName = genre.replace(/-/g, " ");
  const platformName = platform.replace(/-/g, " ");

  return generateRouteMetadata({
    pageType: "best",
    titleBase: `Melhores jogos de ${genreName} para ${platformName}`,
    descriptionBase: `Veja os melhores jogos de ${genreName} para ${platformName}, com analises, ranking e recomendacoes para jogar agora.`,
    canonicalPath: `/best/${genre}/${platform}`
  });
}
