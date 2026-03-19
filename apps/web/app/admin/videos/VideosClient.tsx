"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

interface VideoRow {
  id: string;
  title: string;
  description: string | null;
  published_at: string;
  is_news: boolean;
  sourceId: string;
  sourceName: string;
  url: string;
  gameNames: string[];
  tagNames: string[];
  genreNames: string[];
  platformNames: string[];
}

interface SourceOption {
  id: string;
  name: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function VideosClient() {
  const [list, setList] = useState<VideoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [sources, setSources] = useState<SourceOption[]>([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sourceId, setSourceId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function buildQuery() {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (sourceId) params.set("sourceId", sourceId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }

  function load() {
    setLoading(true);
    fetch(`/api/admin/videos?${buildQuery()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setList([]);
          setTotal(0);
          setTotalPages(0);
          return;
        }
        setList(Array.isArray(data.items) ? data.items : []);
        setTotal(Number(data.total) ?? 0);
        setTotalPages(Number(data.totalPages) ?? 1);
      })
      .catch(() => {
        setList([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page, limit, sourceId, dateFrom, dateTo]);

  useEffect(() => {
    fetch("/api/admin/sources")
      .then((r) => r.json())
      .then((data: { sources?: { id: string; name: string; provider?: string }[] }) => {
        const all = Array.isArray(data.sources) ? data.sources : [];
        setSources(all.filter((s) => s.provider === "youtube"));
      })
      .catch(() => setSources([]));
  }, []);

  async function handleToggleIsNews(id: string, current: boolean) {
    if (togglingId) return;
    const next = !current;
    setList((prev) => prev.map((v) => (v.id === id ? { ...v, is_news: next } : v)));
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_news: next }),
      });
      if (!res.ok) {
        setList((prev) => prev.map((v) => (v.id === id ? { ...v, is_news: current } : v)));
        alert("Falha ao atualizar. Tente de novo.");
      }
    } catch {
      setList((prev) => prev.map((v) => (v.id === id ? { ...v, is_news: current } : v)));
      alert("Falha ao atualizar. Tente de novo.");
    } finally {
      setTogglingId(null);
    }
  }

  function applyFilters() {
    setPage(1);
  }

  function clearFilters() {
    setSourceId("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir o vídeo "${title.slice(0, 50)}${title.length > 50 ? "…" : ""}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      if (res.ok) load();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Erro ao excluir.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  const hasFilters = sourceId || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Vídeos</h1>
      </div>
      <p className="text-muted-foreground">
        Liste, edite ou exclua vídeos do YouTube. Use a Ingestão para trazer novos vídeos dos canais.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Canal (fonte)</Label>
              <Select
                value={sourceId || "__all__"}
                onValueChange={(v) => setSourceId(v === "__all__" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-[200px] bg-background text-foreground">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos os canais</SelectItem>
                  {sources.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Data de (início)</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[160px] bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Data até (fim)</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[160px] bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Por página</Label>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px] bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="secondary" onClick={applyFilters}>
              Filtrar
            </Button>
            {hasFilters ? (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Limpar filtros
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listagem</CardTitle>
          <p className="text-sm font-normal text-muted-foreground">
            {total} vídeo{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum vídeo. Use a Ingestão para trazer vídeos dos canais YouTube.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">Título</th>
                      <th className="p-2 text-left max-w-[200px]">Descrição</th>
                      <th className="p-2 text-left">Conteúdo</th>
                      <th className="p-2 text-left">Canal</th>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Jogos / Tags</th>
                      <th className="p-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((v) => (
                      <tr key={v.id} className="border-b border-border">
                        <td className="p-2 max-w-[240px]">
                          <Link href={`/admin/videos/${v.id}`} className="font-medium text-primary hover:underline line-clamp-2">
                            {v.title}
                          </Link>
                        </td>
                        <td className="p-2 max-w-[200px] text-muted-foreground text-xs line-clamp-2">
                          {v.description ?? "—"}
                        </td>
                        <td className="p-2">
                          <Button
                            type="button"
                            variant={v.is_news ? "default" : "secondary"}
                            size="sm"
                            className="h-7 cursor-pointer px-2.5 font-normal transition-opacity hover:opacity-90"
                            disabled={togglingId === v.id}
                            onClick={() => handleToggleIsNews(v.id, v.is_news)}
                            title="Clique para alternar (exibir no site e relatórios)"
                          >
                            {togglingId === v.id ? "…" : v.is_news ? "Sim" : "Não"}
                          </Button>
                        </td>
                        <td className="p-2 text-muted-foreground">{v.sourceName || v.sourceId || "—"}</td>
                        <td className="p-2 text-muted-foreground">{formatDate(v.published_at)}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {v.gameNames.slice(0, 2).map((n) => (
                              <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                            ))}
                            {v.tagNames.slice(0, 2).map((n) => (
                              <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                            ))}
                            {(v.gameNames.length + v.tagNames.length + v.genreNames.length + v.platformNames.length) > 4 ? (
                              <span className="text-muted-foreground text-xs">+mais</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <Link href={`/admin/videos/${v.id}`}>
                            <Button variant="outline" size="sm">Editar</Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 text-destructive hover:text-destructive"
                            disabled={deletingId === v.id}
                            onClick={() => handleDelete(v.id, v.title)}
                          >
                            {deletingId === v.id ? "Excluindo…" : "Excluir"}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
