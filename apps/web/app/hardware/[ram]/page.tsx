import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const revalidate = 43200;

export async function generateStaticParams(): Promise<Array<{ ram: string }>> {
  const contentProvider = createRouteContentProvider();
  const hardwareProfiles = await contentProvider.getHardwareProfiles();
  return hardwareProfiles.map((ram) => ({ ram }));
}

export async function generateMetadata({
  params,
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

export default async function HardwarePage({
  params,
}: {
  params: Promise<{ ram: string }>;
}) {
  const { ram } = await params;

  return (
    <section>
      <h2>Jogos para PC com {ram} de RAM</h2>
      <p>Recomendacoes de desempenho e titulos compativeis para este perfil.</p>
    </section>
  );
}
