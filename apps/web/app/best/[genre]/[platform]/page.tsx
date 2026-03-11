import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../../src/publishing";
import { createRouteContentProvider } from "../../../../src/content-provider";

export const routeTemplate = "/best/[genre]/[platform]";
export const revalidate = getRevalidateSeconds("best");

type MaybePromise<T> = T | Promise<T>;

export async function generateStaticParams(): Promise<
  Array<{ genre: string; platform: string }>
> {
  const contentProvider = createRouteContentProvider();
  return await contentProvider.getBestGenrePlatformPairs();
}

export async function generateMetadata({
  params
}: {
  params: MaybePromise<{ genre: string; platform: string }>;
}) {
  const { genre, platform } = await Promise.resolve(params);
  const genreName = genre.replace(/-/g, " ");
  const platformName = platform.replace(/-/g, " ");

  return generateRouteMetadata({
    pageType: "best",
    titleBase: `Melhores jogos de ${genreName} para ${platformName}`,
    descriptionBase: `Veja os melhores jogos de ${genreName} para ${platformName}, com analises, ranking e recomendacoes para jogar agora.`,
    canonicalPath: `/best/${genre}/${platform}`
  });
}

export default async function BestGenrePlatformPage({
  params
}: {
  params: MaybePromise<{ genre: string; platform: string }>;
}) {
  const { genre, platform } = await Promise.resolve(params);
  const genreName = genre.replace(/-/g, " ");
  const platformName = platform.replace(/-/g, " ");

  return (
    <section>
      <h2>
        Melhores jogos de {genreName} para {platformName}
      </h2>
      <p>Lista com recomendacoes e contexto para tomada de decisao rapida.</p>
    </section>
  );
}
