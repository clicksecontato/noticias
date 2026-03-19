import { notFound } from "next/navigation";
import { catalogRepository } from "@/src/admin/catalog-repository";
import { videosRepository } from "@/src/admin/videos-repository";
import { VideoEditClient } from "../VideoEditClient";

export default async function AdminVideoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = await videosRepository.getVideoById(id);
  if (!video) notFound();

  const [games, tags, genres, platforms] = await Promise.all([
    catalogRepository.listGames(),
    catalogRepository.listTags(),
    catalogRepository.listGenres(),
    catalogRepository.listPlatforms(),
  ]);

  return (
    <VideoEditClient
      video={video}
      games={games.map((g) => ({ id: g.id, name: g.name }))}
      tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      genres={genres.map((g) => ({ id: g.id, name: g.name }))}
      platforms={platforms.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
