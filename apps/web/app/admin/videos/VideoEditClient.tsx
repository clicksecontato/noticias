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
import type { VideoEditRow } from "@/src/admin/videos-repository";

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
    </div>
  );
}

export function VideoEditClient({
  video,
  games,
  tags,
  genres,
  platforms,
}: {
  video: VideoEditRow;
  games: NameOption[];
  tags: NameOption[];
  genres: NameOption[];
  platforms: NameOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: video.title,
    description: video.description ?? "",
    publishedAt: video.published_at.slice(0, 16),
    is_news: video.is_news ?? true,
  });
  const [gameIds, setGameIds] = useState<string[]>(video.gameIds);
  const [tagIds, setTagIds] = useState<string[]>(video.tagIds);
  const [genreIds, setGenreIds] = useState<string[]>(video.genreIds);
  const [platformIds, setPlatformIds] = useState<string[]>(video.platformIds);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          published_at: form.publishedAt ? new Date(form.publishedAt).toISOString() : video.published_at,
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
      router.push("/admin/videos");
      router.refresh();
    } catch {
      setError("Erro ao enviar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/videos" className="text-sm text-muted-foreground hover:text-foreground underline">
        ← Vídeos
      </Link>
      <h1 className="text-2xl font-semibold">Editar vídeo</h1>
      <p className="text-muted-foreground">
        Altere título, descrição e vínculos. Use &quot;+ Adicionar&quot; para vincular jogos, tags, gêneros e plataformas.
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
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Canal (fonte)</Label>
                <Input value={video.sourceName} readOnly className="bg-muted" />
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
            <div className="space-y-2">
              <Label>URL do vídeo</Label>
              <Input value={video.url} readOnly className="bg-muted" />
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
                Considerar como conteúdo (exibir no site e contabilizar nos relatórios). Desmarque para gameplays/off-topic.
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vínculos</CardTitle>
            <p className="text-sm font-normal text-muted-foreground">
              Jogos, tags, gêneros e plataformas vinculados a este vídeo.
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
          <Link href="/admin/videos">
            <Button type="button" variant="outline">Cancelar</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
