import { notFound } from "next/navigation";
import { catalogRepository } from "@/src/admin/catalog-repository";
import { PlataformaEditClient } from "../PlataformaEditClient";

export default async function AdminPlataformaEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await catalogRepository.listPlatforms();
  const row = list.find((r) => r.id === id);
  if (!row) notFound();
  return (
    <PlataformaEditClient
      platform={{
        id: row.id,
        slug: row.slug,
        name: row.name,
        vendor: row.vendor,
      }}
    />
  );
}
