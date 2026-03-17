import { notFound } from "next/navigation";
import { catalogRepository } from "@/src/admin/catalog-repository";
import { JogoEditClient } from "../JogoEditClient";

export default async function AdminJogoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await catalogRepository.getGameById(id);
  if (!row) notFound();
  return (
    <JogoEditClient
      jogo={{
        id: row.id,
        slug: row.slug,
        name: row.name,
        summary: row.summary ?? "",
        release_date: row.release_date ?? "",
        rating: row.rating ?? undefined,
        status: row.status,
      }}
    />
  );
}
