import { videosRepository } from "@/src/admin/videos-repository";
import {
  parsePautaFilter,
  parseWithoutSubject,
  pautaFilterToIsNews,
} from "@/src/admin/list-filters";
import { NextResponse } from "next/server";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
    const sourceId = searchParams.get("sourceId")?.trim() || undefined;
    const sourceIds = (searchParams.get("sourceIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const dateFrom = searchParams.get("dateFrom")?.trim() || undefined;
    const dateTo = searchParams.get("dateTo")?.trim() || undefined;
    const tagId = searchParams.get("tagId")?.trim() || undefined;
    const subjectId = searchParams.get("subjectId")?.trim() || undefined;
    const creatorTag = searchParams.get("creatorTag")?.trim() || undefined;
    const topic = searchParams.get("topic")?.trim() || undefined;
    const durationBand = searchParams.get("durationBand")?.trim() || undefined;
    const language = searchParams.get("language")?.trim() || undefined;
    const categoryId = searchParams.get("categoryId")?.trim() || undefined;
    const broadcast = searchParams.get("broadcast")?.trim() || undefined;
    const isNews = pautaFilterToIsNews(parsePautaFilter(searchParams.get("pauta")));
    const withoutSubject = parseWithoutSubject(searchParams.get("semAssunto"));

    const offset = (page - 1) * limit;
    const filters = {
      sourceId,
      sourceIds: sourceIds.length > 0 ? sourceIds : undefined,
      dateFrom,
      dateTo,
      isNews,
      withoutSubject,
      tagId,
      subjectId,
      creatorTag,
      topic,
      durationBand,
      language,
      categoryId,
      broadcast,
    };

    const [items, total] = await Promise.all([
      videosRepository.listVideos(limit, offset, filters),
      videosRepository.countVideos(filters),
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
    const message = e instanceof Error ? e.message : "Erro ao listar vídeos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
