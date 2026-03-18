import { newsRepository } from "@/src/admin/news-repository";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
    const sourceId = searchParams.get("sourceId")?.trim() || undefined;
    const dateFrom = searchParams.get("dateFrom")?.trim() || undefined;
    const dateTo = searchParams.get("dateTo")?.trim() || undefined;

    const offset = (page - 1) * limit;
    const filters = { sourceId, dateFrom, dateTo };

    const [items, total] = await Promise.all([
      newsRepository.listArticles(limit, offset, filters),
      newsRepository.countArticles(filters),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao listar notícias";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PostBody = {
  title: string;
  excerpt?: string | null;
  slug?: string | null;
  sourceId: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as PostBody;
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }
    if (!body.sourceId?.trim()) {
      return NextResponse.json({ error: "Fonte é obrigatória" }, { status: 400 });
    }
    const created = await newsRepository.createArticle({
      title: body.title.trim(),
      excerpt: body.excerpt?.trim() || null,
      slug: body.slug?.trim() || null,
      sourceId: body.sourceId.trim(),
      sourceUrl: body.sourceUrl?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      publishedAt: body.publishedAt || null,
    });
    return NextResponse.json(created);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao criar notícia";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
