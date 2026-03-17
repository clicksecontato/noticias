import { catalogRepository } from "@/src/admin/catalog-repository";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  let body: { slug?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  try {
    const list = await catalogRepository.listTags();
    const row = list.find((r) => r.id === id);
    if (!row) return Response.json({ error: "Tag não encontrada" }, { status: 404 });
    const updated = await catalogRepository.updateTag(id, {
      slug: body.slug ?? row.slug,
      name: body.name ?? row.name,
    });
    return Response.json(updated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  try {
    await catalogRepository.deleteTag(id);
    return Response.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 400 });
  }
}
