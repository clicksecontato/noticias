import { createClient } from "@supabase/supabase-js";
import { getDatabaseConfig } from "../../../../packages/database/src/config";

function getClient() {
  const config = getDatabaseConfig();
  const url = config.supabaseUrl;
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  if (!url || !key) throw new Error("Supabase não configurado");
  return createClient(url, key);
}

export interface SubjectRow {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  release_date: string | null;
  rating: number | null;
  status: string;
  cover_url: string | null;
}

export interface TagRow {
  id: string;
  slug: string;
  name: string;
}

export interface TypeRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export const catalogRepository = {
  async listSubjects(limit = 500): Promise<SubjectRow[]> {
    const { data, error } = await getClient()
      .from("subjects")
      .select("id,slug,name,summary,release_date,rating,status,cover_url")
      .order("name")
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as SubjectRow[];
  },

  async getSubjectById(id: string): Promise<SubjectRow | null> {
    const { data, error } = await getClient()
      .from("subjects")
      .select("id,slug,name,summary,release_date,rating,status,cover_url")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as SubjectRow | null;
  },

  async createSubject(row: {
    slug: string;
    name: string;
    summary?: string | null;
    release_date?: string | null;
    rating?: number | null;
    status?: string;
  }): Promise<SubjectRow> {
    const { data, error } = await getClient()
      .from("subjects")
      .insert({
        slug: row.slug.trim(),
        name: row.name.trim(),
        summary: row.summary?.trim() || null,
        release_date: row.release_date || null,
        rating: row.rating ?? null,
        status: row.status ?? "published",
      })
      .select("id,slug,name,summary,release_date,rating,status,cover_url")
      .single();
    if (error) throw new Error(error.message);
    return data as SubjectRow;
  },

  async updateSubject(
    id: string,
    updates: Partial<{ slug: string; name: string; summary: string | null; release_date: string | null; rating: number | null; status: string }>
  ): Promise<SubjectRow> {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.slug !== undefined) body.slug = updates.slug.trim();
    if (updates.name !== undefined) body.name = updates.name.trim();
    if (updates.summary !== undefined) body.summary = updates.summary?.trim() || null;
    if (updates.release_date !== undefined) body.release_date = updates.release_date || null;
    if (updates.rating !== undefined) body.rating = updates.rating;
    if (updates.status !== undefined) body.status = updates.status;
    const { data, error } = await getClient()
      .from("subjects")
      .update(body)
      .eq("id", id)
      .select("id,slug,name,summary,release_date,rating,status,cover_url")
      .single();
    if (error) throw new Error(error.message);
    return data as SubjectRow;
  },

  async deleteSubject(id: string): Promise<void> {
    const { error } = await getClient().from("subjects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listTags(limit = 500): Promise<TagRow[]> {
    const { data, error } = await getClient()
      .from("tags")
      .select("id,slug,name")
      .order("name")
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as TagRow[];
  },

  async createTag(row: { slug: string; name: string }): Promise<TagRow> {
    const { data, error } = await getClient()
      .from("tags")
      .insert({ slug: row.slug.trim(), name: row.name.trim() })
      .select("id,slug,name")
      .single();
    if (error) throw new Error(error.message);
    return data as TagRow;
  },

  async updateTag(id: string, updates: { slug?: string; name?: string }): Promise<TagRow> {
    const body: Record<string, unknown> = {};
    if (updates.slug !== undefined) body.slug = updates.slug.trim();
    if (updates.name !== undefined) body.name = updates.name.trim();
    const { data, error } = await getClient()
      .from("tags")
      .update(body)
      .eq("id", id)
      .select("id,slug,name")
      .single();
    if (error) throw new Error(error.message);
    return data as TagRow;
  },

  async deleteTag(id: string): Promise<void> {
    const { error } = await getClient().from("tags").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async listTypes(limit = 500): Promise<TypeRow[]> {
    const { data, error } = await getClient()
      .from("types")
      .select("id,slug,name,description")
      .order("name")
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []) as TypeRow[];
  },

  async createType(row: { slug: string; name: string; description?: string | null }): Promise<TypeRow> {
    const { data, error } = await getClient()
      .from("types")
      .insert({
        slug: row.slug.trim(),
        name: row.name.trim(),
        description: row.description?.trim() || null,
      })
      .select("id,slug,name,description")
      .single();
    if (error) throw new Error(error.message);
    return data as TypeRow;
  },

  async updateType(id: string, updates: Partial<{ slug: string; name: string; description: string | null }>): Promise<TypeRow> {
    const body: Record<string, unknown> = {};
    if (updates.slug !== undefined) body.slug = updates.slug.trim();
    if (updates.name !== undefined) body.name = updates.name.trim();
    if (updates.description !== undefined) body.description = updates.description?.trim() || null;
    const { data, error } = await getClient()
      .from("types")
      .update(body)
      .eq("id", id)
      .select("id,slug,name,description")
      .single();
    if (error) throw new Error(error.message);
    return data as TypeRow;
  },

  async deleteType(id: string): Promise<void> {
    const { error } = await getClient().from("types").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
