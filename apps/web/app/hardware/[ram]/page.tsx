import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const routeTemplate = "/hardware/[ram]";
export const revalidate = getRevalidateSeconds("hardware");

type MaybePromise<T> = T | Promise<T>;

export async function generateStaticParams(): Promise<Array<{ ram: string }>> {
  const contentProvider = createRouteContentProvider();
  const hardwareProfiles = await contentProvider.getHardwareProfiles();
  return hardwareProfiles.map((ram) => ({ ram }));
}

export async function generateMetadata({
  params
}: {
  params: MaybePromise<{ ram: string }>;
}) {
  const { ram } = await Promise.resolve(params);

  return generateRouteMetadata({
    pageType: "hardware",
    titleBase: `Jogos para PC com ${ram} de RAM`,
    descriptionBase: `Explore jogos recomendados para configuracoes com ${ram} de RAM, incluindo desempenho esperado e generos em destaque.`,
    canonicalPath: `/hardware/${ram}`
  });
}

export default async function HardwarePage({
  params
}: {
  params: MaybePromise<{ ram: string }>;
}) {
  const { ram } = await Promise.resolve(params);

  return (
    <section>
      <h2>Jogos para PC com {ram} de RAM</h2>
      <p>Recomendacoes de desempenho e titulos compativeis para este perfil.</p>
    </section>
  );
}
