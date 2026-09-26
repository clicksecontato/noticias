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
import { youtubeThumbUrl } from "@/src/reports/generators/thumbs";
import { YoutubeFormatoBarChart } from "./YoutubeFormatoBarChart";
import { PresentationStage, Slide } from "./PresentationStage";
import { SourceAvatar } from "../SourceAvatar";
import type {
  ByTypesPayload,
  EmPortuguesPayload,
  PerspectivasPayload,
} from "@/src/reports/generators/editorial-pautas";

function SourceLine({
  name,
  imageUrl,
  provider,
  detail,
  onClick,
}: {
  name: string;
  imageUrl?: string | null;
  provider?: string | null;
  detail: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="inline-flex min-w-0 items-center gap-3">
        <SourceAvatar name={name} imageUrl={imageUrl} provider={provider} size="md" className="size-10" />
        <span className="truncate text-xl font-medium">{name}</span>
      </span>
      <span className="shrink-0 text-lg tabular-nums text-muted-foreground">{detail}</span>
    </>
  );
  if (!onClick) {
    return <li className="flex items-center justify-between gap-4 border-b border-border/60 py-3">{body}</li>;
  }
  return (
    <li className="border-b border-border/60">
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center justify-between gap-4 py-3 text-left hover:text-primary"
      >
        {body}
      </button>
    </li>
  );
}

interface CountedVideo {
  id: string;
  title: string;
  url: string;
  published_at: string;
  sourceName: string;
  thumbnailUrl?: string | null;
  videoId?: string | null;
}

function ymd(value: string | null | undefined): string {
  if (!value) return "";
  return value.includes("T") ? value.slice(0, 10) : value;
}

function PerspectivasVideoDialog({
  openTitle,
  onOpenChange,
  videos,
  loading,
  error,
}: {
  openTitle: string | null;
  onOpenChange: (open: boolean) => void;
  videos: CountedVideo[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <AlertDialog open={openTitle != null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{openTitle}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="theme-scrollbar max-h-[70vh] overflow-y-auto pr-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando vídeos…</p>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : videos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum vídeo neste recorte.</p>
          ) : (
            <ul className="space-y-4">
              {videos.map((video) => {
                const thumb = youtubeThumbUrl(video.videoId, video.thumbnailUrl);
                return (
                  <li key={video.id} className="flex gap-4 border-b border-border/60 pb-4">
                    {thumb ? (
                      <img src={thumb} alt="" className="aspect-video w-40 shrink-0 rounded-lg object-cover" />
                    ) : null}
                    <div className="min-w-0">
                      <a
                        href={`/admin/videos/${video.id}`}
                        className="text-base font-medium text-foreground no-underline hover:text-primary hover:no-underline"
                      >
                        {video.title}
                      </a>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block truncate text-sm text-muted-foreground no-underline hover:text-primary hover:no-underline"
                      >
                        {video.url}
                      </a>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {video.sourceName}
                        {video.published_at
                          ? ` · ${new Date(video.published_at).toLocaleDateString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function PerspectivasView({
  payload,
  sourceAvatars,
}: {
  payload: PerspectivasPayload;
  sourceAvatars?: Record<string, string | null>;
}) {
  const subjects = payload.subjects ?? [];
  const [openTitle, setOpenTitle] = useState<string | null>(null);
  const [videos, setVideos] = useState<CountedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openVideos(title: string, subjectId: string, sourceId?: string) {
    setOpenTitle(title);
    setVideos([]);
    setError(null);
    setLoading(true);
    try {
      const collected: CountedVideo[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = new URLSearchParams({
          subjectId,
          pauta: "in",
          limit: "100",
          page: String(page),
        });
        const from = ymd(payload.period?.start);
        const to = ymd(payload.period?.end);
        if (from) params.set("dateFrom", from);
        if (to) params.set("dateTo", to);
        if (sourceId) params.set("sourceId", sourceId);
        const res = await fetch(`/api/admin/videos?${params.toString()}`);
        const body = (await res.json()) as {
          items?: CountedVideo[];
          totalPages?: number;
          error?: string;
        };
        if (!res.ok) throw new Error(body.error || "Não foi possível carregar os vídeos.");
        collected.push(...(body.items ?? []));
        totalPages = body.totalPages ?? 1;
        page += 1;
      } while (page <= totalPages && page <= 10);
      setVideos(collected);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os vídeos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <PresentationStage kicker="Perspectivas">
      <Slide title="Assuntos em várias fontes">
        {subjects.length === 0 ? (
          <p className="text-lg text-muted-foreground">
            Nenhum assunto aparece em duas ou mais fontes neste período.
          </p>
        ) : (
          <ul className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {subjects.map((subject) => (
              <li key={subject.subject_id} className="border-b border-border/60">
                <button
                  type="button"
                  disabled={subject.videos === 0}
                  onClick={() => void openVideos(subject.subject_name, subject.subject_id)}
                  className="flex w-full cursor-pointer items-baseline justify-between gap-6 py-4 text-left enabled:hover:text-primary disabled:cursor-default"
                >
                  <span className="text-2xl font-medium">{subject.subject_name}</span>
                  <span className="shrink-0 text-lg tabular-nums text-muted-foreground">
                    {subject.sources_total} fontes · {subject.videos} vídeos · {subject.articles} notícias
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Slide>
      {subjects.slice(0, 8).map((subject) => (
        <Slide key={subject.subject_id} title={subject.subject_name}>
          <ul className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {subject.sources.map((source) => (
              <SourceLine
                key={source.source_id}
                name={source.source_name}
                imageUrl={sourceAvatars?.[source.source_id]}
                provider={source.provider}
                detail={
                  source.provider === "youtube"
                    ? `${source.count} ${source.count === 1 ? "vídeo" : "vídeos"}`
                    : `${source.count} ${source.count === 1 ? "notícia" : "notícias"}`
                }
                onClick={
                  source.provider === "youtube" && source.count > 0
                    ? () => void openVideos(`${subject.subject_name} · ${source.source_name}`, subject.subject_id, source.source_id)
                    : undefined
                }
              />
            ))}
          </ul>
        </Slide>
      ))}
    </PresentationStage>
      <PerspectivasVideoDialog
        openTitle={openTitle}
        onOpenChange={(open) => {
          if (!open) setOpenTitle(null);
        }}
        videos={videos}
        loading={loading}
        error={error}
      />
    </>
  );
}

export function EmPortuguesView({
  payload,
  sourceAvatars,
}: {
  payload: EmPortuguesPayload;
  sourceAvatars?: Record<string, string | null>;
}) {
  const numbers = [
    { label: "Vídeos em português", value: String(payload.portuguese_total) },
    { label: "Do período", value: `${payload.pct_portuguese}%` },
    { label: "Canais em português", value: String(payload.channels.length) },
  ];
  return (
    <PresentationStage kicker="Em português">
      <Slide title="Recorte em português">
        <div className="grid h-full content-center gap-4 sm:grid-cols-3">
          {numbers.map((item) => (
            <div key={item.label}>
              <p className="text-base text-muted-foreground">{item.label}</p>
              <p className="text-6xl font-semibold tabular-nums tracking-tight">{item.value}</p>
              <p className="mt-2 text-base text-muted-foreground">{payload.videos_total} vídeos na pauta</p>
            </div>
          ))}
        </div>
      </Slide>
      <Slide title="Canais em português">
        {payload.channels.length === 0 ? (
          <p className="text-lg text-muted-foreground">Nenhum vídeo com áudio em português neste período.</p>
        ) : (
          <ul className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {payload.channels.map((channel) => (
              <SourceLine
                key={channel.source_id}
                name={channel.source_name}
                imageUrl={sourceAvatars?.[channel.source_id]}
                provider="youtube"
                detail={`${channel.portuguese} ${channel.portuguese === 1 ? "vídeo" : "vídeos"}`}
              />
            ))}
          </ul>
        )}
      </Slide>
      <Slide title="Assuntos em português">
        {payload.subjects.length === 0 ? (
          <p className="text-lg text-muted-foreground">Os vídeos em português ainda não têm assuntos classificados.</p>
        ) : (
          <ul className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
            {payload.subjects.map((subject) => (
              <li key={subject.subject_id} className="flex items-baseline justify-between gap-6 border-b border-border/60 py-4">
                <span className="text-2xl font-medium">{subject.subject_name}</span>
                <span className="text-lg tabular-nums text-muted-foreground">
                  {subject.videos} {subject.videos === 1 ? "vídeo" : "vídeos"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Slide>
    </PresentationStage>
  );
}

export function ByTypesView({ payload }: { payload: ByTypesPayload }) {
  const items = payload.items ?? [];
  return (
    <PresentationStage kicker="Tipos">
      <Slide title="Tipos nos vídeos">
        {items.length === 0 ? (
          <p className="text-lg text-muted-foreground">Nenhum tipo classificado neste período.</p>
        ) : (
          <div className="min-h-0 flex-1">
            <YoutubeFormatoBarChart
              fill
              rows={items.map((item) => ({ label: item.type_name, count: item.videos }))}
            />
          </div>
        )}
      </Slide>
      <Slide title="Notícias e vídeos por tipo">
        <ul className="theme-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.type_id} className="flex items-baseline justify-between gap-6 border-b border-border/60 py-4">
              <span className="text-2xl font-medium">{item.type_name}</span>
              <span className="text-lg tabular-nums text-muted-foreground">
                {item.videos} vídeos · {item.articles} notícias
              </span>
            </li>
          ))}
        </ul>
      </Slide>
    </PresentationStage>
  );
}
