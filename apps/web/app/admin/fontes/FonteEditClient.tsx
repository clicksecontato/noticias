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

interface SourceEdit {
  id: string;
  name: string;
  baseUrl: string;
  rssUrl: string;
  language: string;
  trustScore: number;
  isActive: boolean;
  provider: string;
  channelId: string;
}

export function FonteEditClient({ source }: { source: SourceEdit }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: source.name,
    baseUrl: source.baseUrl,
    rssUrl: source.rssUrl,
    language: source.language,
    trustScore: source.trustScore,
    isActive: source.isActive,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(source.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          base_url: form.baseUrl.trim() || null,
          rss_url: form.rssUrl.trim() || null,
          language: form.language,
          trust_score: form.trustScore,
          is_active: form.isActive,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao salvar.");
        return;
      }
      router.push("/admin/fontes");
      router.refresh();
    } catch {
      setError("Erro ao chamar a API.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/fontes" className="text-sm text-muted-foreground hover:text-foreground underline">
          ← Fontes
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Editar fonte</h1>
      <p className="text-muted-foreground">
        ID: <code className="rounded bg-muted px-1">{source.id}</code>
        {source.provider ? ` · ${source.provider === "youtube" ? "YouTube" : "RSS"}` : null}
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL base</Label>
              <Input
                id="baseUrl"
                type="url"
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              />
            </div>
            {source.provider === "rss" ? (
              <div className="space-y-2">
                <Label htmlFor="rssUrl">URL do feed RSS</Label>
                <Input
                  id="rssUrl"
                  type="url"
                  value={form.rssUrl}
                  onChange={(e) => setForm((f) => ({ ...f, rssUrl: e.target.value }))}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={form.language}
                onValueChange={(value) => setForm((f) => ({ ...f, language: value ?? "pt-BR" }))}
              >
                <SelectTrigger id="language" className="h-9 w-full bg-background text-foreground">
                  <SelectValue placeholder="Idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">pt-BR</SelectItem>
                  <SelectItem value="pt">pt</SelectItem>
                  <SelectItem value="en-US">en-US</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trustScore">Trust score (0–100)</Label>
              <Input
                id="trustScore"
                type="number"
                min={0}
                max={100}
                value={form.trustScore}
                onChange={(e) =>
                  setForm((f) => ({ ...f, trustScore: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isActive">Ativo</Label>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </Button>
              <Link href="/admin/fontes">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
