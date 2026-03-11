import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const routeTemplate = "/best/[genre]";
export const revalidate = getRevalidateSeconds("best");

type MaybePromise<T> = T | Promise<T>;

export async function generateStaticParams(): Promise<Array<{ genre: string }>> {
  const contentProvider = createRouteContentProvider();
  const genres = await contentProvider.getBestGenres();
  return genres.map((genre) => ({ genre }));
}

export async function generateMetadata({
  params
}: {
  params: MaybePromise<{ genre: string }>;
}) {
  const { genre } = await Promise.resolve(params);
  const genreName = genre.replace(/-/g, " ");

  return generateRouteMetadata({
    pageType: "best",
    titleBase: `Melhores jogos de ${genreName}`,
    descriptionBase: `Confira os melhores jogos de ${genreName} com listas atualizadas, comparativos e recomendacoes para diferentes perfis.`,
    canonicalPath: `/best/${genre}`
  });
}

export default async function BestGenrePage({
  params
}: {
  params: MaybePromise<{ genre: string }>;
}) {
  const { genre } = await Promise.resolve(params);
  const genreName = genre.replace(/-/g, " ");

  return (
    <section>
      <h2>Melhores jogos de {genreName}</h2>
      <p>Curadoria em pt-BR com foco em qualidade e descoberta.</p>
    </section>
  );
}
