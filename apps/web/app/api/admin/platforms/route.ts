import { catalogRepository } from "@/src/admin/catalog-repository";
import { NextRequest } from "next/server";

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    const list = await catalogRepository.listPlatforms();
    return Response.json(list);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: { slug: string; name: string; vendor?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  if (!body.slug?.trim() || !body.name?.trim()) {
    return Response.json({ error: "slug e name são obrigatórios" }, { status: 400 });
  }
  try {
    const row = await catalogRepository.createPlatform({
      slug: body.slug.trim(),
      name: body.name.trim(),
      vendor: body.vendor ?? null,
    });
    return Response.json(row, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 400 });
  }
}
