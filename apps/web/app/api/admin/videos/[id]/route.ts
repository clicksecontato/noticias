import { videosRepository } from "@/src/admin/videos-repository";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const video = await videosRepository.getVideoById(id);
    if (!video) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(video);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao buscar vídeo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PatchBody = Partial<{
  title: string;
  description: string | null;
  published_at: string;
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
    const video = await videosRepository.getVideoById(id);
    if (!video) return NextResponse.json(null, { status: 404 });

    const updates: Parameters<typeof videosRepository.updateVideo>[1] = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.published_at !== undefined) updates.published_at = body.published_at;
    if (body.is_news !== undefined) updates.is_news = body.is_news;
    if (Object.keys(updates).length > 0) {
      await videosRepository.updateVideo(id, updates);
    }

    if (
      body.gameIds !== undefined ||
      body.tagIds !== undefined ||
      body.genreIds !== undefined ||
      body.platformIds !== undefined
    ) {
      await videosRepository.setVideoEntities(id, {
        gameIds: body.gameIds ?? video.gameIds,
        tagIds: body.tagIds ?? video.tagIds,
        genreIds: body.genreIds ?? video.genreIds,
        platformIds: body.platformIds ?? video.platformIds,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao atualizar vídeo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const video = await videosRepository.getVideoById(id);
    if (!video) return NextResponse.json(null, { status: 404 });
    await videosRepository.deleteVideo(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao excluir vídeo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
