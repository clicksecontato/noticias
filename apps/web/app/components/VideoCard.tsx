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
  gameNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
  platformNames?: string[];
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
    <Card className={cn("overflow-hidden", className)}>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-auto w-full object-cover"
            width={320}
            height={180}
            loading="lazy"
          />
        ) : (
          <div
            className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground"
            aria-hidden
          >
            Vídeo
          </div>
        )}
      </a>
      <CardHeader className="pb-1">
        <CardTitle className="text-base">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:underline"
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
        <p className="text-xs text-muted-foreground">{video.sourceName}</p>
        <p className="text-xs text-muted-foreground/80">{dateStr}</p>
        <EntityChips
          gameNames={video.gameNames}
          tagNames={video.tagNames}
          genreNames={video.genreNames}
          platformNames={video.platformNames}
        />
      </CardContent>
    </Card>
  );
}
