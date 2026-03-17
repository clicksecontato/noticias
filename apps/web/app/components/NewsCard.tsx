import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EntityChips } from "./EntityChips";
import { cn } from "@/lib/utils";
import { classifyMediaUrl } from "@/src/media-utils";

export interface NewsCardData {
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedAt: string;
  imageUrl?: string | null;
  gameNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
  platformNames?: string[];
}

interface NewsCardProps {
  card: NewsCardData;
  formatDate?: (iso: string) => string;
  className?: string;
}

const defaultFormatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export function NewsCard({
  card,
  formatDate = defaultFormatDate,
  className,
}: NewsCardProps) {
  const media = classifyMediaUrl(card.imageUrl);
  return (
    <article>
      <Card className={cn("overflow-hidden", className)}>
        {media?.kind === "image" ? (
          <Link
            href={`/news/${card.slug}`}
            className="block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={media.url}
              alt=""
              className="h-auto w-full object-cover"
              width={400}
              height={220}
              loading="lazy"
            />
          </Link>
        ) : media?.kind === "video" ? (
          <div className="aspect-video w-full overflow-hidden bg-black">
            <iframe
              src={media.url}
              title={card.title}
              className="h-full w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : null}
        <CardHeader className="pb-1">
          <CardTitle>
            <Link
              href={`/news/${card.slug}`}
              className="font-semibold leading-tight text-foreground hover:underline"
            >
              {card.title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 pt-0">
          <CardDescription className="line-clamp-3">{card.summary}</CardDescription>
          <p className="text-xs text-muted-foreground">Fonte: {card.sourceName}</p>
          <p className="text-xs text-muted-foreground/80">
            Publicado em: {formatDate(card.publishedAt)}
          </p>
          <EntityChips
            gameNames={card.gameNames}
            tagNames={card.tagNames}
            genreNames={card.genreNames}
            platformNames={card.platformNames}
          />
        </CardContent>
      </Card>
    </article>
  );
}
