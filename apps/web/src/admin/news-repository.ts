import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";

function getClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    || "noticia";
}

/** Converte data fim (YYYY-MM-DD) para o início do dia seguinte em UTC, para usar com .lt() e incluir o dia inteiro até 23:59:59. */
function dateToEndExclusive(dateTo: string): string {
  const d = new Date(dateTo + "T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export interface ArticleListRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  is_news: boolean;
  sourceId: string;
  sourceName: string;
  subjectNames: string[];
  tagNames: string[];
  typeNames: string[];
}

export interface ArticleEditRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string | null;
  content_html: string | null;
  image_url: string | null;
  published_at: string;
  status: string;
  is_news: boolean;
  sourceId: string;
  sourceUrl: string | null;
  subjectIds: string[];
  tagIds: string[];
  typeIds: string[];
}

export interface SourceOption {
  id: string;
  name: string;
}

export interface ListArticlesFilters {
  limit?: number;
  offset?: number;
  sourceId?: string;
  /** ISO date string (inclusive). */
  dateFrom?: string;
  /** ISO date string (inclusive). */
  dateTo?: string;
}

export const newsRepository = {
  async listSources(): Promise<SourceOption[]> {
    const { data, error } = await getClient()
      .from("sources")
      .select("id,name")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return (data ?? []) as SourceOption[];
  },

  async countArticles(filters: ListArticlesFilters = {}): Promise<number> {
    const client = getClient();
    const { sourceId, dateFrom, dateTo } = filters;

    let query = client.from("articles").select("id", { count: "exact", head: true });
    if (dateFrom) query = query.gte("published_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) query = query.lt("published_at", dateToEndExclusive(dateTo));

    if (sourceId) {
      const { data: linkRows, error: linkError } = await client
        .from("article_sources")
        .select("article_id")
        .eq("source_id", sourceId);
      if (linkError) throw new Error(linkError.message);
      const articleIds = (linkRows ?? []).map((r: { article_id: string }) => r.article_id);
      if (articleIds.length === 0) return 0;
      query = query.in("id", articleIds);
    }

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  async listArticles(limit = 100, offset = 0, filters: Omit<ListArticlesFilters, "limit" | "offset"> = {}): Promise<ArticleListRow[]> {
    const client = getClient();
    const { sourceId, dateFrom, dateTo } = filters;

    let query = client
      .from("articles")
      .select("id,slug,title,excerpt,published_at,is_news")
      .order("published_at", { ascending: false });

    if (dateFrom) query = query.gte("published_at", dateFrom + "T00:00:00.000Z");
    if (dateTo) query = query.lt("published_at", dateToEndExclusive(dateTo));

    if (sourceId) {
      const { data: linkRows, error: linkError } = await client
        .from("article_sources")
        .select("article_id")
        .eq("source_id", sourceId);
      if (linkError) throw new Error(linkError.message);
      const articleIds = (linkRows ?? []).map((r: { article_id: string }) => r.article_id);
      if (articleIds.length === 0) return [];
      query = query.in("id", articleIds);
    }

    const { data: rows, error } = await query.range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    const articles = (rows ?? []) as Array<{ id: string; slug: string; title: string; excerpt: string | null; published_at: string; is_news: boolean }>;
    if (articles.length === 0) return [];

    const ids = articles.map((a) => a.id);
    const [sourcesData, asub, at, atype] = await Promise.all([
      client.from("article_sources").select("article_id,source_id").in("article_id", ids),
      client.from("article_subjects").select("article_id, subjects(name)").in("article_id", ids),
      client.from("article_tags").select("article_id, tags(name)").in("article_id", ids),
      client.from("article_types").select("article_id, types(name)").in("article_id", ids),
    ]);

    const sourceByArticle = new Map<string, string>();
    for (const r of sourcesData?.data ?? []) {
      if (!sourceByArticle.has(r.article_id)) sourceByArticle.set(r.article_id, r.source_id);
    }
    const { data: sourcesRows } = await client.from("sources").select("id,name");
    const sourceNameById = new Map((sourcesRows ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

    const addNames = (
      list: Array<{ article_id: string; subjects?: { name: string }; tags?: { name: string }; types?: { name: string } }>,
      sub: "subjects" | "tags" | "types"
    ) => {
      const byArticle = new Map<string, string[]>();
      for (const r of list ?? []) {
        const name = r[sub]?.name;
        if (!name) continue;
        const arr = byArticle.get(r.article_id) ?? [];
        arr.push(name);
        byArticle.set(r.article_id, arr);
      }
      return byArticle;
    };

    const subjectNamesByArticle = addNames((asub.data ?? []) as never[], "subjects");
    const tagNamesByArticle = addNames((at.data ?? []) as never[], "tags");
    const typeNamesByArticle = addNames((atype.data ?? []) as never[], "types");

    return articles.map((a) => {
      const sourceId = sourceByArticle.get(a.id) ?? "";
      return {
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        published_at: a.published_at,
        is_news: a.is_news ?? true,
        sourceId,
        sourceName: sourceNameById.get(sourceId) ?? "",
        subjectNames: subjectNamesByArticle.get(a.id) ?? [],
        tagNames: tagNamesByArticle.get(a.id) ?? [],
        typeNames: typeNamesByArticle.get(a.id) ?? [],
      };
    });
  },

  async getArticleById(id: string): Promise<ArticleEditRow | null> {
    const client = getClient();
    const { data: article, error } = await client
      .from("articles")
      .select("id,slug,title,excerpt,content_md,content_html,image_url,published_at,status,is_news")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!article) return null;

    const [sourceLink, subjects, tags, types] = await Promise.all([
      client.from("article_sources").select("source_id,source_url").eq("article_id", id).limit(1).maybeSingle(),
      client.from("article_subjects").select("subject_id").eq("article_id", id),
      client.from("article_tags").select("tag_id").eq("article_id", id),
      client.from("article_types").select("type_id").eq("article_id", id),
    ]);

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt ?? null,
      content_md: article.content_md ?? null,
      content_html: article.content_html ?? null,
      image_url: article.image_url ?? null,
      published_at: article.published_at,
      status: article.status ?? "published",
      is_news: article.is_news ?? true,
      sourceId: sourceLink?.data?.source_id ?? "",
      sourceUrl: sourceLink?.data?.source_url ?? null,
      subjectIds: (subjects.data ?? []).map((r: { subject_id: string }) => r.subject_id),
      tagIds: (tags.data ?? []).map((r: { tag_id: string }) => r.tag_id),
      typeIds: (types.data ?? []).map((r: { type_id: string }) => r.type_id),
    };
  },

  async createArticle(params: {
    title: string;
    excerpt?: string | null;
    slug?: string | null;
    sourceId: string;
    sourceUrl?: string | null;
    imageUrl?: string | null;
    publishedAt?: string | null;
    contentMd?: string | null;
    contentHtml?: string | null;
  }): Promise<{ id: string; slug: string }> {
    const client = getClient();
    const baseSlug = (params.slug?.trim() || slugify(params.title)).slice(0, 200);
    let slug = baseSlug;
    let n = 0;
    while (true) {
      const { data: existing } = await client.from("articles").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${++n}`;
    }
    const publishedAt = params.publishedAt || new Date().toISOString();
    const { data: inserted, error } = await client
      .from("articles")
      .insert({
        slug: slug.trim(),
        title: params.title.trim(),
        excerpt: params.excerpt?.trim() || null,
        content_md: params.contentMd?.trim() || null,
        content_html: params.contentHtml?.trim() || null,
        image_url: params.imageUrl?.trim() || null,
        published_at: publishedAt,
        status: "published",
        is_news: true,
        canonical_url: `https://noticias-ia-platform.local/news/${slug}`,
        source_article_hash: "",
        ai_model: "admin",
        quality_score: 0,
      })
      .select("id,slug")
      .single();
    if (error) throw new Error(error.message);
    const articleId = (inserted as { id: string; slug: string }).id;
    await client.from("article_sources").upsert(
      {
        article_id: articleId,
        source_id: params.sourceId,
        source_url: params.sourceUrl?.trim() || null,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "article_id,source_id" }
    );
    return { id: articleId, slug: (inserted as { id: string; slug: string }).slug };
  },

  async updateArticle(
    id: string,
    updates: Partial<{
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
    }>
  ): Promise<void> {
    const client = getClient();
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) body.title = updates.title.trim();
    if (updates.excerpt !== undefined) body.excerpt = updates.excerpt?.trim() || null;
    if (updates.slug !== undefined) body.slug = updates.slug.trim();
    if (updates.imageUrl !== undefined) body.image_url = updates.imageUrl?.trim() || null;
    if (updates.publishedAt !== undefined) body.published_at = updates.publishedAt;
    if (updates.contentMd !== undefined) body.content_md = updates.contentMd?.trim() || null;
    if (updates.contentHtml !== undefined) body.content_html = updates.contentHtml?.trim() || null;
    if (updates.status !== undefined) body.status = updates.status;
    if (updates.is_news !== undefined) body.is_news = updates.is_news;
    if (Object.keys(body).length > 1) {
      const { error } = await client.from("articles").update(body).eq("id", id);
      if (error) throw new Error(error.message);
    }
    if (updates.sourceId !== undefined || updates.sourceUrl !== undefined) {
      const { data: current } = await client.from("article_sources").select("source_id, source_url").eq("article_id", id).limit(1).maybeSingle();
      const cur = current as { source_id: string; source_url: string | null } | null;
      const sourceId = updates.sourceId ?? cur?.source_id ?? "";
      const sourceUrl = updates.sourceUrl !== undefined ? updates.sourceUrl : cur?.source_url ?? null;
      await client.from("article_sources").delete().eq("article_id", id);
      if (sourceId) {
        await client.from("article_sources").insert({
          article_id: id,
          source_id: sourceId,
          source_url: sourceUrl,
          fetched_at: new Date().toISOString(),
        });
      }
    }
  },

  async deleteArticle(id: string): Promise<void> {
    const client = getClient();
    const { error } = await client.from("articles").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async setArticleEntities(
    articleId: string,
    ids: { subjectIds: string[]; tagIds: string[]; typeIds: string[] }
  ): Promise<void> {
    const client = getClient();
    await client.from("article_subjects").delete().eq("article_id", articleId);
    await client.from("article_tags").delete().eq("article_id", articleId);
    await client.from("article_types").delete().eq("article_id", articleId);
    for (const subjectId of ids.subjectIds) {
      await client.from("article_subjects").upsert({ article_id: articleId, subject_id: subjectId }, { onConflict: "article_id,subject_id" });
    }
    for (const tagId of ids.tagIds) {
      await client.from("article_tags").upsert({ article_id: articleId, tag_id: tagId }, { onConflict: "article_id,tag_id" });
    }
    for (const typeId of ids.typeIds) {
      await client.from("article_types").upsert({ article_id: articleId, type_id: typeId }, { onConflict: "article_id,type_id" });
    }
  },
};
