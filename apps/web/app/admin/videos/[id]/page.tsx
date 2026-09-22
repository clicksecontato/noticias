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

  const [subjects, tags, types] = await Promise.all([
    catalogRepository.listSubjects(),
    catalogRepository.listTags(),
    catalogRepository.listTypes(),
  ]);

  return (
    <VideoEditClient
      video={video}
      subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
      tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      types={types.map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
