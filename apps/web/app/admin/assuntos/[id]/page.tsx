import { notFound } from "next/navigation";
import { catalogRepository } from "@/src/admin/catalog-repository";
import { AssuntoEditClient } from "../AssuntoEditClient";

export default async function AdminAssuntoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await catalogRepository.getSubjectById(id);
  if (!row) notFound();
  return (
    <AssuntoEditClient
      assunto={{
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
