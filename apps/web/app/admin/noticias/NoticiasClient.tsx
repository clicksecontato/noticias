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

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  is_news: boolean;
  sourceId: string;
  sourceName: string;
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

export function NoticiasClient() {
  const [list, setList] = useState<ArticleRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
    fetch(`/api/admin/news?${buildQuery()}`)
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
      .then((data: { sources?: { id: string; name: string }[] }) => {
        setSources(Array.isArray(data.sources) ? data.sources : []);
      })
      .catch(() => setSources([]));
  }, []);

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
    if (!confirm(`Excluir a notícia "${title.slice(0, 50)}${title.length > 50 ? "…" : ""}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
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
        <h1 className="text-2xl font-semibold">Notícias</h1>
        <Link href="/admin/noticias/nova">
          <Button size="sm">Nova notícia</Button>
        </Link>
      </div>
      <p className="text-muted-foreground">
        Liste, edite ou exclua notícias. Use os filtros e a paginação abaixo.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Fonte</Label>
              <Select
                value={sourceId || "__all__"}
                onValueChange={(v) => setSourceId(v === "__all__" ? "" : (v ?? ""))}
              >
                <SelectTrigger className="w-[200px] bg-background text-foreground">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas as fontes</SelectItem>
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
            {total} notícia{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma notícia. Ajuste os filtros ou use Ingestão para trazer notícias do RSS.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">Título</th>
                      <th className="p-2 text-left">Notícia</th>
                      <th className="p-2 text-left">Fonte</th>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Jogos / Tags</th>
                      <th className="p-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((a) => (
                      <tr key={a.id} className="border-b border-border">
                        <td className="p-2 max-w-[240px]">
                          <Link href={`/admin/noticias/${a.id}`} className="font-medium text-primary hover:underline line-clamp-2">
                            {a.title}
                          </Link>
                        </td>
                        <td className="p-2">
                          <Badge variant={a.is_news ? "default" : "secondary"}>
                            {a.is_news ? "Sim" : "Não"}
                          </Badge>
                        </td>
                        <td className="p-2 text-muted-foreground">{a.sourceName || a.sourceId || "—"}</td>
                        <td className="p-2 text-muted-foreground">{formatDate(a.published_at)}</td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {a.gameNames.slice(0, 2).map((n) => (
                              <Badge key={n} variant="secondary" className="text-xs">{n}</Badge>
                            ))}
                            {a.tagNames.slice(0, 2).map((n) => (
                              <Badge key={n} variant="outline" className="text-xs">{n}</Badge>
                            ))}
                            {(a.gameNames.length + a.tagNames.length + a.genreNames.length + a.platformNames.length) > 4 ? (
                              <span className="text-muted-foreground text-xs">+mais</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <Link href={`/admin/noticias/${a.id}`}>
                            <Button variant="ghost" size="sm">Editar</Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === a.id}
                            onClick={() => handleDelete(a.id, a.title)}
                          >
                            {deletingId === a.id ? "Excluindo…" : "Excluir"}
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
