import {
  generateRouteMetadata,
  getRevalidateSeconds
} from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const routeTemplate = "/hardware/[ram]";
export const revalidate = getRevalidateSeconds("hardware");

export async function generateStaticParams(): Promise<Array<{ ram: string }>> {
  const contentProvider = createRouteContentProvider();
  const hardwareProfiles = await contentProvider.getHardwareProfiles();
  return hardwareProfiles.map((ram) => ({ ram }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ ram: string }>;
}) {
  const { ram } = await params;

  return generateRouteMetadata({
    pageType: "hardware",
    titleBase: `Jogos para PC com ${ram} de RAM`,
    descriptionBase: `Explore jogos recomendados para configuracoes com ${ram} de RAM, incluindo desempenho esperado e generos em destaque.`,
    canonicalPath: `/hardware/${ram}`
  });
}
