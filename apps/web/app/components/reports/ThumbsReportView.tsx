"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PresentationStage, Slide } from "./PresentationStage";
import { SourceAvatar } from "../SourceAvatar";
import type { ThumbChannel, ThumbVideo, ThumbsPayload } from "@/src/reports/generators/thumbs";

function ThumbGrid({
  items,
}: {
  items: Array<ThumbVideo & { caption: string; hint?: string }>;
}) {
  return (
    <ul className="theme-scrollbar grid min-h-0 flex-1 auto-rows-max grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((video) => (
        <li key={video.id}>
          <a
            href={`/admin/videos/${video.id}`}
            className="group block no-underline hover:no-underline"
          >
            <img
              src={video.thumbnail_url}
              alt=""
              className="aspect-video w-full rounded-lg object-cover ring-1 ring-border transition group-hover:ring-primary"
            />
            <p className="mt-2 truncate text-sm font-medium text-foreground">{video.caption}</p>
            {video.hint ? <p className="truncate text-xs text-muted-foreground">{video.hint}</p> : null}
          </a>
        </li>
      ))}
    </ul>
  );
}

function channelItems(channel: ThumbChannel) {
  return channel.videos.map((video) => ({
    ...video,
    caption: video.title,
    hint: new Date(video.published_at).toLocaleDateString("pt-BR"),
  }));
}

export function ThumbsReportView({
  payload,
  sourceAvatars,
}: {
  payload: ThumbsPayload;
  sourceAvatars?: Record<string, string | null>;
}) {
  const channels = payload.channels ?? [];
  const [sourceId, setSourceId] = useState(channels[0]?.source_id ?? "");
  const selected = channels.find((channel) => channel.source_id === sourceId) ?? channels[0];

  return (
    <PresentationStage kicker="Análise de thumbs">
      <Slide title="Uma thumb por canal">
        {channels.length === 0 ? (
          <p className="text-lg text-muted-foreground">Nenhuma thumb de vídeo neste período.</p>
        ) : (
          <ThumbGrid
            items={channels.map((channel) => {
              const latest = channel.videos[0];
              return {
                ...latest,
                caption: channel.source_name,
                hint: `${channel.videos.length} ${channel.videos.length === 1 ? "vídeo" : "vídeos"}`,
              };
            })}
          />
        )}
      </Slide>
      <Slide title="Thumbs do canal">
        {selected ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <Select value={selected.source_id} onValueChange={(value) => setSourceId(value ?? "")}>
              <SelectTrigger className="h-16 w-full max-w-xl gap-3 text-lg">
                <SourceAvatar
                  name={selected.source_name}
                  imageUrl={sourceAvatars?.[selected.source_id]}
                  provider="youtube"
                  size="md"
                  className="size-12"
                />
                <SelectValue placeholder="Escolha um canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((channel) => (
                  <SelectItem key={channel.source_id} value={channel.source_id} className="py-2 text-base">
                    <span className="inline-flex items-center gap-3">
                      <SourceAvatar
                        name={channel.source_name}
                        imageUrl={sourceAvatars?.[channel.source_id]}
                        provider="youtube"
                        size="md"
                        className="size-10"
                      />
                      <span>
                        {channel.source_name}
                        <span className="ml-2 text-muted-foreground">{channel.videos.length}</span>
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ThumbGrid items={channelItems(selected)} />
          </div>
        ) : (
          <p className="text-lg text-muted-foreground">Nenhum canal com thumbs neste período.</p>
        )}
      </Slide>
    </PresentationStage>
  );
}
