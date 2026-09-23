import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EntityChips } from "./EntityChips";
import { cn } from "@/lib/utils";

export interface VideoCardData {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  sourceName: string;
  publishedAt: string;
  subjectNames?: string[];
  tagNames?: string[];
  typeNames?: string[];
}

interface VideoCardProps {
  video: VideoCardData;
  className?: string;
}

export function VideoCard({ video, className }: VideoCardProps) {
  const dateStr = new Date(video.publishedAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 transition-colors hover:border-primary/40 hover:bg-primary-soft/40",
        className
      )}
    >
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="aspect-video h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            width={320}
            height={180}
            loading="lazy"
          />
        ) : (
          <div
            className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground"
            aria-hidden
          >
            Vídeo
          </div>
        )}
      </a>
      <CardHeader className="pb-2">
        <CardTitle className="text-base leading-snug">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground no-underline hover:text-primary hover:no-underline"
          >
            {video.title}
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {video.description ? (
          <CardDescription className="line-clamp-2 text-sm leading-snug">
            {video.description}
          </CardDescription>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{video.sourceName}</span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <time dateTime={video.publishedAt}>{dateStr}</time>
        </div>
        <EntityChips
          subjectNames={video.subjectNames}
          tagNames={video.tagNames}
          typeNames={video.typeNames}
        />
      </CardContent>
    </Card>
  );
}
