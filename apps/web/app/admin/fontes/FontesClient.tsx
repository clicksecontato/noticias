"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface SourceItem {
  id: string;
  name: string;
  rssUrl?: string;
  language: string;
  isActive: boolean;
  provider?: "rss" | "youtube";
  channelId?: string;
  baseUrl?: string;
  trustScore?: number;
}

export function FontesClient() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function loadSources() {
    setLoading(true);
    fetch("/api/admin/sources?all=true")
      .then((res) => res.json())
      .then((data: { sources?: SourceItem[] }) => {
        setSources(Array.isArray(data.sources) ? data.sources : []);
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }

  async function handleToggleActive(id: string, current: boolean) {
    if (togglingId) return;
    const next = !current;
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: next } : s)));
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        setSources((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: current } : s)));
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Falha ao atualizar. Tente de novo.");
      }
    } catch {
      setSources((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: current } : s)));
      alert("Falha ao atualizar. Tente de novo.");
    } finally {
      setTogglingId(null);
    }
  }

  useEffect(() => {
    loadSources();
  }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir a fonte "${name}"? Artigos e vídeos vinculados podem ser afetados.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/sources/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) loadSources();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao excluir.");
      }
    } finally {
      setDeleting(false);
    }
  }

  const rssCount = sources.filter((s) => s.provider === "rss").length;
  const youtubeCount = sources.filter((s) => s.provider === "youtube").length;
  const titleSuffix =
    loading ? "" : ` (RSS[${rssCount}] - YouTube[${youtubeCount}])`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">
          Fontes{titleSuffix}
        </h1>
        <Link href="/admin/ingestao">
          <Button size="sm">Adicionar fonte (ingestão)</Button>
        </Link>
      </div>
      <p className="text-muted-foreground">
        Liste, edite ou remova fontes de conteúdo (RSS e YouTube). Para criar nova fonte, use o
        formulário na página de Ingestão.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listagem</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : sources.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma fonte cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Tipo</th>
                    <th className="p-2 text-left">Idioma</th>
                    <th className="p-2 text-left">Ativo</th>
                    <th className="p-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.id} className="border-b border-border">
                      <td className="p-2 font-medium">{s.name}</td>
                      <td className="p-2 text-muted-foreground">{s.id}</td>
                      <td className="p-2">
                        <Badge variant={s.provider === "youtube" ? "default" : "secondary"}>
                          {s.provider === "youtube" ? "YouTube" : "RSS"}
                        </Badge>
                      </td>
                      <td className="p-2">{s.language}</td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant={s.isActive ? "default" : "secondary"}
                          size="sm"
                          className="h-7 cursor-pointer px-2.5 font-normal transition-opacity hover:opacity-90"
                          disabled={togglingId === s.id}
                          onClick={() => handleToggleActive(s.id, s.isActive)}
                          title="Clique para alternar entre Sim e Não"
                        >
                          {togglingId === s.id ? "…" : s.isActive ? "Sim" : "Não"}
                        </Button>
                      </td>
                      <td className="p-2 text-right">
                        <Link href={`/admin/fontes/${encodeURIComponent(s.id)}`}>
                          <Button variant="outline" size="sm">Editar</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 text-destructive hover:text-destructive"
                          disabled={deleting}
                          onClick={() => handleDelete(s.id, s.name)}
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
