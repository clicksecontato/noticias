"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TagsChart, type ByTagsItem } from "./TagsChart";

interface NewsRow {
  id: string;
  title: string;
  published_at: string;
  sourceName: string;
}

function ymd(value: string | null | undefined): string {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

export function TagNewsChart({
  data,
  fill = false,
  dateFrom,
  dateTo,
  sourceId,
}: {
  data: ByTagsItem[];
  fill?: boolean;
  dateFrom?: string | null;
  dateTo?: string | null;
  sourceId?: string | null;
}) {
  const [tag, setTag] = useState<ByTagsItem | null>(null);
  const [items, setItems] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openTag(item: ByTagsItem) {
    setTag(item);
    setItems([]);
    setError(null);
    setLoading(true);
    try {
      const collected: NewsRow[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = new URLSearchParams({
          tagId: item.tag_id,
          pauta: "in",
          limit: "100",
          page: String(page),
        });
        const from = ymd(dateFrom);
        const to = ymd(dateTo);
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);
        if (sourceId) params.set("sourceId", sourceId);
        const res = await fetch(`/api/admin/news?${params.toString()}`);
        const body = (await res.json()) as {
          items?: NewsRow[];
          totalPages?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error || "Não foi possível carregar as notícias.");
        collected.push(...(body.items ?? []));
        totalPages = body.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= 10);
      setItems(collected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as notícias.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TagsChart data={data} fill={fill} onTagClick={(item) => void openTag(item)} />
      <AlertDialog open={tag != null} onOpenChange={(open) => { if (!open) setTag(null); }}>
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{tag?.tag_name}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="theme-scrollbar max-h-[60vh] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando notícias…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma notícia nesta tag no período.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((article) => (
                  <li key={article.id} className="border-b border-border/60 pb-3">
                    <a
                      href={`/admin/noticias/${article.id}`}
                      className="text-base font-medium text-foreground no-underline hover:text-primary hover:no-underline"
                    >
                      {article.title}
                    </a>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {article.sourceName}
                      {article.published_at
                        ? ` · ${new Date(article.published_at).toLocaleDateString("pt-BR")}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
