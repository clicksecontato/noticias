"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GameRow {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  release_date: string | null;
  rating: number | null;
  status: string;
}

export function JogosClient() {
  const [list, setList] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ slug: "", name: "", summary: "" });
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/games")
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
      const res = await fetch("/api/admin/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim(),
          summary: form.summary.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar.");
        return;
      }
      setForm({ slug: "", name: "", summary: "" });
      setShowForm(false);
      load();
    } catch {
      setError("Erro ao chamar API.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o jogo "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/games/${id}`, { method: "DELETE" });
      if (res.ok) load();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao excluir.");
      }
    } catch {
      alert("Erro ao excluir.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Jogos</h1>
      <p className="text-muted-foreground">Catálogo de jogos para enriquecimento e relatórios.</p>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Listagem</CardTitle>
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancelar" : "Novo jogo"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm ? (
            <form onSubmit={handleCreate} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="ex: meu-jogo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Nome do jogo"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resumo (opcional)</Label>
                <Input
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Breve descrição"
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Criar"}</Button>
            </form>
          ) : null}

          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">Nenhum jogo cadastrado.</p>
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
                        <Link href={`/admin/jogos/${row.id}`}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(row.id, row.name)}
                        >
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
