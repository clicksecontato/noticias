import { generateRouteMetadata } from "../../../src/publishing";
import { createRouteContentProvider } from "../../../src/content-provider";
import { PageBackLink } from "../../components/PageBackLink";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

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
  const titleBase = `Assuntos como ${slug.replace(/-/g, " ")}`;

  return generateRouteMetadata({
    pageType: "subjects-like",
    titleBase,
    descriptionBase: `Descubra assuntos parecidos com ${slug.replace(/-/g, " ")}, com foco em temas, estilo e contexto relacionados.`,
    canonicalPath: `/subjects-like/${slug}`
  });
}

export default async function SubjectsLikePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contentProvider = createRouteContentProvider();
  const subjects = await contentProvider.getHomeSubjectCards(12);
  const current = subjects.find((s) => s.slug === slug);
  const related = subjects.filter((s) => s.slug !== slug);

  return (
    <section className="space-y-6">
      <PageBackLink href={`/subjects/${slug}`}>← Voltar ao assunto</PageBackLink>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Assuntos como {current?.title ?? slug.replace(/-/g, " ")}
        </h1>
        <p className="text-muted-foreground">
          Explore outros assuntos do catálogo relacionados ao tema.
        </p>
      </header>
      {related.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum outro assunto no catálogo.</p>
      ) : (
        <ul className="space-y-3">
          {related.map((item) => (
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
