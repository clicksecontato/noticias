import { notFound } from "next/navigation";
import { catalogRepository } from "@/src/admin/catalog-repository";
import { newsRepository } from "@/src/admin/news-repository";
import { NoticiaEditClient } from "../NoticiaEditClient";

export default async function AdminNoticiaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await newsRepository.getArticleById(id);
  if (!article) notFound();

  const [sources, subjects, tags, types] = await Promise.all([
    newsRepository.listSources(),
    catalogRepository.listSubjects(),
    catalogRepository.listTags(),
    catalogRepository.listTypes(),
  ]);

  return (
    <NoticiaEditClient
      article={article}
      sources={sources}
      subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      types={types.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
