import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  eyebrow?: string;
  title: string;
  description: string;
  /** CTA principal (preenchido). */
  ctaHref?: string;
  ctaLabel?: string;
  /** CTA secundário (outline). */
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  className?: string;
}

export function HeroSection({
  eyebrow,
  title,
  description,
  ctaHref = "/videos",
  ctaLabel = "Ver vídeos",
  secondaryCtaHref = "/news",
  secondaryCtaLabel = "Ver notícias",
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "surface-brand relative overflow-hidden rounded-xl shadow-lg",
        className
      )}
    >
      <div className="accent-bar" aria-hidden />
      <div className="relative space-y-5 px-6 py-10 sm:px-10 sm:py-12">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="max-w-2xl text-4xl font-bold text-foreground sm:text-5xl">
          {title.includes(" ") ? (
            <>
              {title.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="gradient-text">{title.split(" ").slice(-1)[0]}</span>
            </>
          ) : (
            <span className="gradient-text">{title}</span>
          )}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-wrap gap-4 pt-1">
          <Link href={ctaHref} className={cn(buttonVariants({ size: "lg" }))}>
            {ctaLabel}
          </Link>
          {secondaryCtaHref && secondaryCtaLabel ? (
            <Link
              href={secondaryCtaHref}
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              {secondaryCtaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
