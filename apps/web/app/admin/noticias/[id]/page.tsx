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

  const [sources, games, tags, genres, platforms] = await Promise.all([
    newsRepository.listSources(),
    catalogRepository.listGames(),
    catalogRepository.listTags(),
    catalogRepository.listGenres(),
    catalogRepository.listPlatforms(),
  ]);

  return (
    <NoticiaEditClient
      article={article}
      sources={sources}
      games={games.map((g) => ({ id: g.id, name: g.name }))}
      tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      genres={genres.map((g) => ({ id: g.id, name: g.name }))}
      platforms={platforms.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
