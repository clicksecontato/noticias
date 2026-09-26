"use client";

import { useEffect, useMemo, useState } from "react";
import { useRegisterAdminStage } from "@/src/admin/admin-stage-mode";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YoutubeFormatoBarChart } from "../components/reports/YoutubeFormatoBarChart";
import type { YoutubeFormatoPayload } from "@/src/reports/generators/youtube-formato";

type BarRow = { label: string; count: number; hours?: number };

type Slide =
  | { id: string; title: string; kind: "overview" }
  | { id: string; title: string; kind: "bars"; rows: BarRow[] };

function visibleRows(rows: BarRow[]): BarRow[] {
  return rows.filter((row) => row.count > 0);
}

function buildSlides(payload: YoutubeFormatoPayload): Slide[] {
  const slides: Slide[] = [{ id: "overview", title: "YouTube neste período", kind: "overview" }];
  const sections: Array<{ id: string; title: string; rows: BarRow[] }> = [
    { id: "duration", title: "Duração", rows: payload.duration_bands },
    { id: "language", title: "Idioma do áudio", rows: payload.languages },
    { id: "broadcast", title: "Transmissão", rows: payload.broadcast },
    {
      id: "category",
      title: "Categoria YouTube",
      rows: payload.categories.map((row) => ({ label: row.label, count: row.count })),
    },
    { id: "tags", title: "Tags do criador", rows: payload.creator_tags },
    { id: "topics", title: "Tópicos do YouTube", rows: payload.topics },
  ];
  for (const section of sections) {
    const rows = visibleRows(section.rows);
    if (rows.length === 0) continue;
    slides.push({ id: section.id, title: section.title, kind: "bars", rows });
  }
  return slides;
}

function CountList({ title, rows }: { title: string; rows: BarRow[] }) {
  const visible = visibleRows(rows);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada neste recorte.</p>
        ) : (
          <>
            <YoutubeFormatoBarChart rows={visible} />
            <RowList rows={visible} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function RowList({ rows, large = false }: { rows: BarRow[]; large?: boolean }) {
  return (
    <ul className={large ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2 text-sm"}>
      {rows.map((row) => (
        <li key={row.label} className="flex items-baseline justify-between gap-3">
          <span className={large ? "text-lg" : undefined}>{row.label}</span>
          <span className={large ? "text-lg text-muted-foreground" : "text-muted-foreground"}>
            {row.count}
            {row.hours != null && row.hours > 0 ? ` · ${row.hours} h` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function OverviewSlide({ payload }: { payload: YoutubeFormatoPayload }) {
  const figures = [
    { label: "Horas assistíveis", value: String(payload.hours_total), note: `${payload.videos_total} vídeos na pauta` },
    { label: "Em português", value: `${payload.pct_portuguese}%`, note: "do áudio no período" },
    { label: "Com legenda", value: `${payload.pct_captions}%`, note: "faixa disponível" },
  ];
  return (
    <div className="grid flex-1 content-center gap-8 sm:grid-cols-3">
      {figures.map((figure) => (
        <div key={figure.label} className="text-center">
          <p className="text-lg text-muted-foreground">{figure.label}</p>
          <p className="mt-3 text-7xl font-semibold tracking-tight sm:text-8xl">{figure.value}</p>
          <p className="mt-3 text-base text-muted-foreground">{figure.note}</p>
        </div>
      ))}
    </div>
  );
}

function StageDeck({ payload }: { payload: YoutubeFormatoPayload }) {
  useRegisterAdminStage();
  const slides = useMemo(() => buildSlides(payload), [payload]);
  const [index, setIndex] = useState(0);
  const slide = slides[Math.min(index, slides.length - 1)] ?? slides[0];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        setIndex((current) => Math.min(current + 1, slides.length - 1));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        setIndex((current) => Math.max(current - 1, 0));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [slides.length]);

  if (!slide) return null;

  return (
    <section className="fixed inset-0 z-40 flex flex-col bg-background py-8 pl-10 pr-20 text-foreground">
      <header className="flex items-end justify-between gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Formato do YouTube
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{slide.title}</h2>
        </div>
        <p className="text-lg tabular-nums text-muted-foreground">
          {index + 1} / {slides.length}
        </p>
      </header>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {slide.kind === "overview" ? (
          <OverviewSlide payload={payload} />
        ) : (
          <>
            <div className="min-h-0 flex-1">
              <YoutubeFormatoBarChart rows={slide.rows} fill />
            </div>
            <RowList rows={slide.rows} large />
          </>
        )}
      </div>

      <footer className="mt-6 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-30"
          onClick={() => setIndex((current) => Math.max(current - 1, 0))}
          disabled={index === 0}
        >
          <ChevronLeft className="size-4" aria-hidden />
          Anterior
        </button>
        <p className="text-sm text-muted-foreground">Setas do teclado trocam a tela</p>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-30"
          onClick={() => setIndex((current) => Math.min(current + 1, slides.length - 1))}
          disabled={index >= slides.length - 1}
        >
          Próxima
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </footer>
    </section>
  );
}

export function YoutubeFormatoView({
  payload,
  variant = "stage",
}: {
  payload: YoutubeFormatoPayload;
  /** Palco em tela cheia no relatório. Compacto dentro da apresentação do mês. */
  variant?: "stage" | "inline";
}) {
  if (variant === "inline") {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Horas assistíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{payload.hours_total}</p>
              <p className="text-xs text-muted-foreground">{payload.videos_total} vídeos na pauta</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em português</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{payload.pct_portuguese}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Com legenda</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{payload.pct_captions}%</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <CountList title="Duração" rows={payload.duration_bands} />
          <CountList title="Idioma do áudio" rows={payload.languages} />
          <CountList title="Transmissão" rows={payload.broadcast} />
          <CountList
            title="Categoria YouTube"
            rows={payload.categories.map((row) => ({ label: row.label, count: row.count }))}
          />
          <CountList title="Tags do criador" rows={payload.creator_tags} />
          <CountList title="Tópicos do YouTube" rows={payload.topics} />
        </div>
      </div>
    );
  }

  return <StageDeck payload={payload} />;
}
