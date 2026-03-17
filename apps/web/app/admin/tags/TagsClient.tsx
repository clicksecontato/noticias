"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TagRow {
  id: string;
  slug: string;
  name: string;
}

export function TagsClient() {
  const [list, setList] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "" });
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/tags")
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: form.slug.trim(), name: form.name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar.");
        return;
      }
      setForm({ slug: "", name: "" });
      setShowForm(false);
      load();
    } catch {
      setError("Erro ao chamar API.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a tag "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
      if (res.ok) load();
      else {
        const d = await res.json().catch(() => ({}));
        alert(d.error || "Erro ao excluir.");
      }
    } catch {
      alert("Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tags</h1>
      <p className="text-muted-foreground">Catálogo de tags para enriquecimento.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Listagem</CardTitle>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "Nova tag"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm ? (
            <form onSubmit={handleCreate} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="ex: acao" required />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ação" required />
                </div>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar"}</Button>
            </form>
          ) : null}

          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma tag cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">Slug</th>
                    <th className="p-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id} className="border-b border-border">
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2 text-muted-foreground">{row.slug}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(row.id, row.name)}>
                          Excluir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
