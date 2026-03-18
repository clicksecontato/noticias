"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import type { ArticleEditRow } from "@/src/admin/news-repository";

interface SourceOption {
  id: string;
  name: string;
}

interface NameOption {
  id: string;
  name: string;
}

interface EntityChipRowProps {
  title: string;
  selectedIds: string[];
  options: NameOption[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function EntityChipRow({ title, selectedIds, options, onAdd, onRemove }: EntityChipRowProps) {
  const [addValue, setAddValue] = useState("__add__");
  const selected = options.filter((o) => selectedIds.includes(o.id));
  const available = options.filter((o) => !selectedIds.includes(o.id));
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{title}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {selected.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-sm"
          >
            {o.name}
            <button
              type="button"
              onClick={() => onRemove(o.id)}
              className="rounded p-0.5 hover:bg-muted"
              aria-label={`Remover ${o.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {available.length > 0 ? (
          <Select
            value={addValue}
            onValueChange={(v) => {
              if (v && v !== "__add__") {
                onAdd(v);
                setAddValue("__add__");
              }
            }}
          >
            <SelectTrigger className="h-8 w-fit min-w-[8rem] bg-background text-foreground">
              <SelectValue placeholder="+ Adicionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__add__">+ Adicionar</SelectItem>
              {available.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      {selected.length === 0 && available.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum item no catálogo. Cadastre em Jogos/Tags/Gêneros/Plataformas.</p>
      ) : null}
    </div>
  );
}

export function NoticiaEditClient({
  article,
  sources,
  games,
  tags,
  genres,
  platforms,
}: {
  article: ArticleEditRow;
  sources: SourceOption[];
  games: NameOption[];
  tags: NameOption[];
  genres: NameOption[];
  platforms: NameOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: article.title,
    excerpt: article.excerpt ?? "",
    slug: article.slug,
    sourceId: article.sourceId,
    sourceUrl: article.sourceUrl ?? "",
    imageUrl: article.image_url ?? "",
    publishedAt: article.published_at.slice(0, 16),
    is_news: article.is_news ?? true,
  });
  const [gameIds, setGameIds] = useState<string[]>(article.gameIds);
  const [tagIds, setTagIds] = useState<string[]>(article.tagIds);
  const [genreIds, setGenreIds] = useState<string[]>(article.genreIds);
  const [platformIds, setPlatformIds] = useState<string[]>(article.platformIds);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/news/${article.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || null,
          slug: form.slug.trim(),
          sourceId: form.sourceId || null,
          sourceUrl: form.sourceUrl.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
          publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : article.published_at,
          is_news: form.is_news,
          gameIds,
          tagIds,
          genreIds,
          platformIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao salvar.");
        return;
      }
      router.push("/admin/noticias");
      router.refresh();
    } catch {
      setError("Erro ao enviar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/noticias" className="text-sm text-muted-foreground hover:text-foreground underline">
        ← Notícias
      </Link>
      <h1 className="text-2xl font-semibold">Editar notícia</h1>
      <p className="text-muted-foreground">
        Altere os dados e vincule jogos, tags, gêneros e plataformas. Use &quot;+ Adicionar&quot; para vincular e o X para remover.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados básicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publishedAt">Data de publicação</Label>
                <Input
                  id="publishedAt"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_news"
                type="checkbox"
                checked={form.is_news}
                onChange={(e) => setForm((f) => ({ ...f, is_news: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_news" className="cursor-pointer font-normal">
                Considerar como notícia (exibir no site e contabilizar nos relatórios). Desmarque para gameplays/assuntos off-topic.
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceId">Fonte</Label>
              <Select
                value={form.sourceId || "__empty__"}
                onValueChange={(value) => setForm((f) => ({ ...f, sourceId: value === "__empty__" ? "" : (value ?? "") }))}
              >
                <SelectTrigger id="sourceId" className="h-9 w-full bg-background text-foreground">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">—</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">URL do artigo na fonte</Label>
              <Input
                id="sourceUrl"
                value={form.sourceUrl}
                onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da imagem de capa</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vínculos</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Adicione ou remova jogos, tags, gêneros e plataformas desta notícia.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <EntityChipRow
              title="Jogos"
              selectedIds={gameIds}
              options={games}
              onAdd={(id) => setGameIds((prev) => [...prev, id])}
              onRemove={(id) => setGameIds((prev) => prev.filter((x) => x !== id))}
            />
            <EntityChipRow
              title="Tags"
              selectedIds={tagIds}
              options={tags}
              onAdd={(id) => setTagIds((prev) => [...prev, id])}
              onRemove={(id) => setTagIds((prev) => prev.filter((x) => x !== id))}
            />
            <EntityChipRow
              title="Gêneros"
              selectedIds={genreIds}
              options={genres}
              onAdd={(id) => setGenreIds((prev) => [...prev, id])}
              onRemove={(id) => setGenreIds((prev) => prev.filter((x) => x !== id))}
            />
            <EntityChipRow
              title="Plataformas"
              selectedIds={platformIds}
              options={platforms}
              onAdd={(id) => setPlatformIds((prev) => [...prev, id])}
              onRemove={(id) => setPlatformIds((prev) => prev.filter((x) => x !== id))}
            />
          </CardContent>
        </Card>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
          <Link href="/admin/noticias">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
