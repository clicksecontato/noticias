"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Newspaper } from "lucide-react";
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
import { AdminPageTitle } from "../components/AdminPageTitle";
import { EntityChips } from "../../components/EntityChips";
import { useSystemDialogs } from "../../components/useSystemDialogs";
import { buildDeleteConfirmCopy } from "@/src/ui/confirm-dialog";
import {
  parsePautaFilter,
  parseWithoutSubject,
  type PautaFilter,
} from "@/src/admin/list-filters";

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  is_news: boolean;
  sourceId: string;
  sourceName: string;
  subjectNames: string[];
  tagNames: string[];
  typeNames: string[];
}

interface SourceOption {
  id: string;
  name: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function NoticiasClient() {
  const { showAlert, showConfirm, dialogs } = useSystemDialogs();
  const searchParams = useSearchParams();
  const [list, setList] = useState<ArticleRow[]>([]);
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
  const [pauta, setPauta] = useState<PautaFilter>(() =>
    parsePautaFilter(searchParams.get("pauta"))
  );
  const [semAssunto, setSemAssunto] = useState(() =>
    parseWithoutSubject(searchParams.get("semAssunto"))
  );

  function buildQuery() {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (sourceId) params.set("sourceId", sourceId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (pauta === "in") params.set("pauta", "1");
    if (pauta === "out") params.set("pauta", "0");
    if (semAssunto) params.set("semAssunto", "1");
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
  }, [page, limit, sourceId, dateFrom, dateTo, pauta, semAssunto]);

  useEffect(() => {
    fetch("/api/admin/sources")
      .then((r) => r.json())
      .then((data: { sources?: { id: string; name: string }[] }) => {
        setSources(Array.isArray(data.sources) ? data.sources : []);
      })
      .catch(() => setSources([]));
  }, []);

  async function handleToggleIsNews(id: string, current: boolean) {
    if (togglingId) return;
    const next = !current;
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, is_news: next } : a)));
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_news: next }),
      });
      if (!res.ok) {
        setList((prev) => prev.map((a) => (a.id === id ? { ...a, is_news: current } : a)));
        showAlert("Falha ao atualizar. Tente de novo.", "Erro");
      }
    } catch {
      setList((prev) => prev.map((a) => (a.id === id ? { ...a, is_news: current } : a)));
      showAlert("Falha ao atualizar. Tente de novo.", "Erro");
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
    setPauta("all");
    setSemAssunto(false);
    setPage(1);
  }

  function handleDelete(id: string, title: string) {
    const copy = buildDeleteConfirmCopy({
      entity: "notícia",
      name: title,
      maxNameLength: 50,
    });
    showConfirm({
      ...copy,
      confirmVariant: "destructive",
      onConfirm: async () => {
        setDeletingId(id);
        try {
          const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
          if (res.ok) load();
          else {
            const data = await res.json().catch(() => ({}));
            showAlert(data.error || "Erro ao excluir.", "Erro");
          }
        } finally {
          setDeletingId(null);
        }
      },
    });
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

  const hasFilters = sourceId || dateFrom || dateTo || pauta !== "all" || semAssunto;

  const sourceSelectItems = {
    __all__: "Todas as fontes",
    ...Object.fromEntries(sources.map((s) => [s.id, s.name])),
  };

  const pautaSelectItems = {
    all: "Todas",
    in: "Na pauta",
    out: "Fora da pauta",
  };

  const pageSizeItems = Object.fromEntries(
    PAGE_SIZE_OPTIONS.map((n) => [String(n), String(n)])
  );

  return (
    <div className="space-y-6">
      {dialogs}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AdminPageTitle icon={Newspaper}>Notícias</AdminPageTitle>
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
                items={sourceSelectItems}
              >
                <SelectTrigger className="w-[200px] bg-background text-foreground">
                  <SelectValue placeholder="Todas as fontes" />
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
              <Label className="text-xs">Pauta</Label>
              <Select
                value={pauta}
                onValueChange={(v) => {
                  setPauta((v as PautaFilter) || "all");
                  setPage(1);
                }}
                items={pautaSelectItems}
              >
                <SelectTrigger className="w-[160px] bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="in">Na pauta</SelectItem>
                  <SelectItem value="out">Fora da pauta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <input
                id="sem-assunto"
                type="checkbox"
                checked={semAssunto}
                onChange={(e) => {
                  setSemAssunto(e.target.checked);
                  setPage(1);
                }}
                className="size-4 accent-primary"
              />
              <Label htmlFor="sem-assunto" className="cursor-pointer text-xs font-normal">
                Sem assunto
              </Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Por página</Label>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
                items={pageSizeItems}
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

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {total} notícia{total !== 1 ? "s" : ""} encontrada{total !== 1 ? "s" : ""}
        </p>
        {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma notícia. Ajuste os filtros ou use Atualizar Fontes para trazer notícias do RSS.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border border-border/60">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left">Título</th>
                      <th className="p-2 text-left">Na pauta</th>
                      <th className="p-2 text-left">Fonte</th>
                      <th className="p-2 text-left">Data</th>
                      <th className="p-2 text-left">Assuntos / Tags</th>
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
                          <Button
                            type="button"
                            variant={a.is_news ? "default" : "secondary"}
                            size="sm"
                            className="h-7 cursor-pointer px-2.5 font-normal transition-opacity hover:opacity-90"
                            disabled={togglingId === a.id}
                            onClick={() => handleToggleIsNews(a.id, a.is_news)}
                            title="Clique para alternar se entra na pauta editorial"
                          >
                            {togglingId === a.id ? "…" : a.is_news ? "Sim" : "Não"}
                          </Button>
                        </td>
                        <td className="p-2 text-muted-foreground">{a.sourceName || a.sourceId || "—"}</td>
                        <td className="p-2 text-muted-foreground">{formatDate(a.published_at)}</td>
                        <td className="p-2">
                          <EntityChips
                            className="mt-0"
                            subjectNames={a.subjectNames.slice(0, 2)}
                            tagNames={a.tagNames.slice(0, 2)}
                            typeNames={
                              a.subjectNames.length + a.tagNames.length < 4
                                ? a.typeNames.slice(0, 2)
                                : []
                            }
                          />
                          {a.subjectNames.length +
                            a.tagNames.length +
                            a.typeNames.length >
                          4 ? (
                            <span className="text-muted-foreground text-xs">+mais</span>
                          ) : null}
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
      </div>
    </div>
  );
}
