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

interface AssuntoEdit {
  id: string;
  slug: string;
  name: string;
  summary: string;
  release_date: string;
  rating?: number;
  status: string;
}

export function AssuntoEditClient({ assunto }: { assunto: AssuntoEdit }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: assunto.slug,
    name: assunto.name,
    summary: assunto.summary,
    release_date: assunto.release_date,
    rating: assunto.rating ?? "",
    status: assunto.status,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/subjects/${assunto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim(),
          summary: form.summary.trim() || null,
          release_date: form.release_date || null,
          rating: form.rating === "" ? null : Number(form.rating),
          status: form.status,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao salvar.");
        return;
      }
      router.push("/admin/assuntos");
      router.refresh();
    } catch {
      setError("Erro ao chamar a API.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/assuntos" className="text-sm text-muted-foreground hover:text-foreground underline">
        ← Assuntos
      </Link>
      <h1 className="text-2xl font-semibold">Editar assunto</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campos</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Resumo</Label>
              <Input value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de lançamento (YYYY-MM-DD)</Label>
                <Input type="date" value={form.release_date} onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nota (0–10)</Label>
                <Input type="number" min={0} max={10} step={0.1} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm((f) => ({ ...f, status: value ?? "published" }))}
              >
                <SelectTrigger className="h-9 w-full bg-background text-foreground">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">published</SelectItem>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="archived">archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
              <Link href="/admin/assuntos">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
