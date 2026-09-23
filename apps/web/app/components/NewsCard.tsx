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
  subjectNames?: string[];
  tagNames?: string[];
  typeNames?: string[];
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
      <Card
        className={cn(
          "overflow-hidden border-border/80 transition-colors hover:border-primary/40 hover:bg-primary-soft/40",
          className
        )}
      >
        {media?.kind === "image" ? (
          <Link
            href={`/news/${card.slug}`}
            className="block overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              src={media.url}
              alt=""
              className="aspect-[16/9] h-auto w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg leading-snug sm:text-xl">
            <Link
              href={`/news/${card.slug}`}
              className="font-semibold text-foreground no-underline hover:text-primary hover:no-underline"
            >
              {card.title}
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 pt-0">
          <CardDescription className="line-clamp-3 text-sm leading-relaxed">
            {card.summary}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{card.sourceName}</span>
            <span aria-hidden className="text-border">
              ·
            </span>
            <time dateTime={card.publishedAt}>{formatDate(card.publishedAt)}</time>
          </div>
          <EntityChips
            subjectNames={card.subjectNames}
            tagNames={card.tagNames}
            typeNames={card.typeNames}
          />
        </CardContent>
      </Card>
    </article>
  );
}
