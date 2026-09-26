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
import type { VideoSliceParam } from "@/src/reports/month-presentation-video-slides";
import { YoutubeFormatoBarChart, type YoutubeFormatoBarRow } from "./YoutubeFormatoBarChart";

interface VideoRow {
  id: string;
  title: string;
  published_at: string;
  sourceName: string;
}

function ymd(value: string | null | undefined): string {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

export function VideoSliceChart({
  rows,
  param,
  fill = false,
  dateFrom,
  dateTo,
  sourceIds,
}: {
  rows: Array<{ key: string; label: string; count: number }>;
  param: VideoSliceParam;
  fill?: boolean;
  dateFrom?: string | null;
  dateTo?: string | null;
  sourceIds?: string[];
}) {
  const [slice, setSlice] = useState<{ key: string; label: string } | null>(null);
  const [items, setItems] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openSlice(row: { key: string; label: string }) {
    setSlice(row);
    setItems([]);
    setError(null);
    setLoading(true);
    try {
      const collected: VideoRow[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = new URLSearchParams({
          [param]: row.key,
          pauta: "in",
          limit: "100",
          page: String(page),
        });
        const from = ymd(dateFrom);
        const to = ymd(dateTo);
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);
        if (sourceIds && sourceIds.length > 0) params.set("sourceIds", sourceIds.join(","));
        const res = await fetch(`/api/admin/videos?${params.toString()}`);
        const body = (await res.json()) as {
          items?: VideoRow[];
          totalPages?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error || "Não foi possível carregar os vídeos.");
        collected.push(...(body.items ?? []));
        totalPages = body.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= 10);
      setItems(collected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os vídeos.");
    } finally {
      setLoading(false);
    }
  }

  const chartRows: YoutubeFormatoBarRow[] = rows.map((row) => ({
    key: row.key,
    label: row.label,
    count: row.count,
  }));

  return (
    <>
      <YoutubeFormatoBarChart
        rows={chartRows}
        fill={fill}
        onBarClick={(row) => {
          if (!row.key) return;
          void openSlice({ key: row.key, label: row.label });
        }}
      />
      <AlertDialog
        open={slice != null}
        onOpenChange={(open) => {
          if (!open) setSlice(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{slice?.label}</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="theme-scrollbar max-h-[60vh] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando vídeos…</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum vídeo neste recorte.</p>
            ) : (
              <ul className="space-y-3">
                {items.map((video) => (
                  <li key={video.id} className="border-b border-border/60 pb-3">
                    <a
                      href={`/admin/videos/${video.id}`}
                      className="text-base font-medium text-foreground no-underline hover:text-primary hover:no-underline"
                    >
                      {video.title}
                    </a>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {video.sourceName}
                      {video.published_at
                        ? ` · ${new Date(video.published_at).toLocaleDateString("pt-BR")}`
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
