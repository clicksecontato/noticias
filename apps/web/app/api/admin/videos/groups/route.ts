import { videosRepository } from "@/src/admin/videos-repository";
import { NextResponse } from "next/server";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom")?.trim().slice(0, 10) ?? "";
    const dateTo = searchParams.get("dateTo")?.trim().slice(0, 10) ?? "";
    if (!dateFrom || !dateTo) {
      return NextResponse.json({ error: "Período obrigatório." }, { status: 400 });
    }
    const groups = await videosRepository.editorialGroups(dateFrom, dateTo);
    return NextResponse.json(groups);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao agrupar vídeos";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
