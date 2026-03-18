import { newsRepository } from "@/src/admin/news-repository";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const article = await newsRepository.getArticleById(id);
    if (!article) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(article);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao buscar notícia";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PatchBody = Partial<{
  title: string;
  excerpt: string | null;
  slug: string;
  sourceId: string;
  sourceUrl: string | null;
  imageUrl: string | null;
  publishedAt: string;
  contentMd: string | null;
  contentHtml: string | null;
  status: string;
  is_news: boolean;
  gameIds: string[];
  tagIds: string[];
  genreIds: string[];
  platformIds: string[];
}>;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const body = (await request.json()) as PatchBody;
    const article = await newsRepository.getArticleById(id);
    if (!article) return NextResponse.json(null, { status: 404 });

    const updates: Parameters<typeof newsRepository.updateArticle>[1] = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.excerpt !== undefined) updates.excerpt = body.excerpt;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.sourceId !== undefined) updates.sourceId = body.sourceId;
    if (body.sourceUrl !== undefined) updates.sourceUrl = body.sourceUrl;
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.publishedAt !== undefined) updates.publishedAt = body.publishedAt;
    if (body.contentMd !== undefined) updates.contentMd = body.contentMd;
    if (body.contentHtml !== undefined) updates.contentHtml = body.contentHtml;
    if (body.status !== undefined) updates.status = body.status;
    if (body.is_news !== undefined) updates.is_news = body.is_news;
    if (Object.keys(updates).length > 0) {
      await newsRepository.updateArticle(id, updates);
    }

    if (
      body.gameIds !== undefined ||
      body.tagIds !== undefined ||
      body.genreIds !== undefined ||
      body.platformIds !== undefined
    ) {
      await newsRepository.setArticleEntities(id, {
        gameIds: body.gameIds ?? article.gameIds,
        tagIds: body.tagIds ?? article.tagIds,
        genreIds: body.genreIds ?? article.genreIds,
        platformIds: body.platformIds ?? article.platformIds,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao atualizar notícia";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const article = await newsRepository.getArticleById(id);
    if (!article) return NextResponse.json(null, { status: 404 });
    await newsRepository.deleteArticle(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao excluir notícia";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
