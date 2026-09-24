import { cn } from "@/lib/utils";

/** Avatar circular de fonte (YouTube/RSS). */
export function SourceAvatar({
  name,
  imageUrl,
  provider,
  size = "sm",
  className,
}: {
  name: string;
  imageUrl?: string | null;
  provider?: "rss" | "youtube" | string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const sizeClass =
    size === "xs" ? "size-5" : size === "md" ? "size-9" : "size-7";
  const textClass = size === "xs" ? "text-[8px]" : size === "md" ? "text-xs" : "text-[10px]";
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const fallback =
    provider === "youtube" ? "YT" : provider === "rss" ? "RSS" : initial;

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        className={cn(
          sizeClass,
          "shrink-0 rounded-full object-cover ring-1 ring-border/60",
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        sizeClass,
        textClass,
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ring-1 ring-border/40",
        className
      )}
      aria-hidden
    >
      {fallback.length > 2 ? initial : fallback}
    </span>
  );
}
