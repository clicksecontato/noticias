import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";
import { PageBackLink } from "../../components/PageBackLink";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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
    descriptionBase: `Confira os melhores assuntos de ${typeName} com listas atualizadas, comparativos e recomendacoes.`,
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
  const contentProvider = createRouteContentProvider();
  const subjects = await contentProvider.getHomeSubjectCards(24);

  return (
    <section className="space-y-6">
      <PageBackLink href="/news">← Notícias</PageBackLink>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Melhores de {typeName}</h1>
        <p className="text-muted-foreground">
          Curadoria em pt-BR com foco em qualidade e descoberta. O tipo{" "}
          <strong>{typeName}</strong> agrupa assuntos do catálogo.
        </p>
      </header>
      {subjects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Catálogo de assuntos vazio.</p>
      ) : (
        <ul className="space-y-3">
          {subjects.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/subjects/${item.slug}`}
                className={buttonVariants({ variant: "link", className: "h-auto p-0 text-base" })}
              >
                {item.title}
              </Link>
              {item.summary ? (
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
