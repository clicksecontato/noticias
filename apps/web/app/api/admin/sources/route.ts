import { createClient } from "@supabase/supabase-js";
import { createContentRepository } from "../../../../../../packages/database/src/content-repository";

export async function GET(): Promise<Response> {
  const repository = createContentRepository();
  const sources = await repository.getActivePortugueseSources();
  const sourceIds = sources.map((s) => s.id);
  return Response.json({
    sourceIds,
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      rssUrl: s.rssUrl,
      language: s.language,
      isActive: s.isActive
    }))
  });
}

type PostSourceBody = {
  id: string;
  name: string;
  rss_url: string;
  language: string;
  base_url?: string;
  is_active?: boolean;
  trust_score?: number;
};

export async function POST(request: Request): Promise<Response> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json(
      { error: "Configuração Supabase ausente" },
      { status: 500 }
    );
  }

  let body: PostSourceBody;
  try {
    body = (await request.json()) as PostSourceBody;
  } catch {
    return Response.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const { id, name, rss_url, language, base_url, is_active, trust_score } = body;
  if (!id?.trim() || !name?.trim() || !rss_url?.trim() || !language?.trim()) {
    return Response.json(
      { error: "Campos obrigatórios: id, name, rss_url, language" },
      { status: 400 }
    );
  }

  const validLanguage = ["pt-BR", "pt", "en-US"].includes(language)
    ? language
    : "pt-BR";
  const client = createClient(url, serviceKey);
  const now = new Date().toISOString();

  const { data, error } = await client
    .from("sources")
    .upsert(
      {
        id: id.trim(),
        name: name.trim(),
        rss_url: rss_url.trim(),
        language: validLanguage,
        base_url: base_url?.trim() || null,
        is_active: is_active ?? true,
        trust_score: trust_score ?? 50,
        updated_at: now
      },
      { onConflict: "id" }
    )
    .select("id,name,rss_url,language,base_url,is_active,trust_score")
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(
    {
      id: data.id,
      name: data.name,
      rssUrl: data.rss_url,
      language: data.language,
      baseUrl: data.base_url,
      isActive: data.is_active,
      trustScore: data.trust_score
    },
    { status: 201 }
  );
}
