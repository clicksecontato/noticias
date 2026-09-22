import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";

export const revalidate = 43200;

export async function generateStaticParams(): Promise<Array<{ type: string }>> {
  const contentProvider = createRouteContentProvider();
  const types = await contentProvider.getBestTypes();
  return types.map((type) => ({ type }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const typeName = type.replace(/-/g, " ");

  return generateRouteMetadata({
    pageType: "best",
    titleBase: `Melhores de ${typeName}`,
    descriptionBase: `Confira os melhores assuntos de ${typeName} com listas atualizadas, comparativos e recomendacoes para diferentes perfis.`,
    canonicalPath: `/best/${type}`
  });
}

export default async function BestTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const typeName = type.replace(/-/g, " ");

  return (
    <section>
      <h2>Melhores de {typeName}</h2>
      <p>Curadoria em pt-BR com foco em qualidade e descoberta.</p>
    </section>
  );
}
