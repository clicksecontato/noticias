"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface SourceOption {
  id: string;
  name: string;
}

export default function NovaNoticiaPage() {
  const router = useRouter();
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    slug: "",
    sourceId: "",
    sourceUrl: "",
    imageUrl: "",
  });

  useEffect(() => {
    fetch("/api/admin/sources")
      .then((r) => r.json())
      .then((data: { sources?: { id: string; name: string }[] }) => {
        const srcList = Array.isArray(data.sources) ? data.sources : [];
        setSources(srcList);
        const firstId = srcList[0]?.id;
        if (firstId) {
          setForm((f) => (f.sourceId ? f : { ...f, sourceId: firstId }));
        }
      })
      .catch(() => setSources([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Título é obrigatório.");
      return;
    }
    if (!form.sourceId.trim()) {
      setError("Selecione uma fonte.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || null,
          slug: form.slug.trim() || null,
          sourceId: form.sourceId.trim(),
          sourceUrl: form.sourceUrl.trim() || null,
          imageUrl: form.imageUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar notícia.");
        return;
      }
      router.replace(`/admin/noticias/${data.id}`);
    } catch {
      setError("Erro ao enviar. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/noticias">
          <Button variant="ghost" size="sm">← Notícias</Button>
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Nova notícia</h1>
      <p className="text-muted-foreground">
        Crie uma notícia manualmente. Depois você pode editar e vincular jogos, tags, gêneros e plataformas.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados básicos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título da notícia"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Resumo (opcional)</Label>
              <Textarea
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Breve resumo"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (opcional — gerado do título se vazio)</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="url-amigavel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceId">Fonte *</Label>
              <Select
                value={form.sourceId || "__empty__"}
                onValueChange={(value) => setForm((f) => ({ ...f, sourceId: value === "__empty__" ? "" : (value ?? "") }))}
              >
                <SelectTrigger id="sourceId" className="h-9 w-full bg-background text-foreground">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__empty__">Selecione</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">URL do artigo na fonte (opcional)</Label>
              <Input
                id="sourceUrl"
                value={form.sourceUrl}
                onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL da imagem de capa (opcional)</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Criando…" : "Criar notícia"}
              </Button>
              <Link href="/admin/noticias">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
