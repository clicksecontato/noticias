import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationNavProps {
  prevPage: number | null;
  nextPage: number | null;
  currentPage: number;
  totalPages: number;
  buildPrevHref: () => string;
  buildNextHref: () => string;
  prevLabel?: string;
  nextLabel?: string;
  className?: string;
}

export function PaginationNav({
  prevPage,
  nextPage,
  currentPage,
  totalPages,
  buildPrevHref,
  buildNextHref,
  prevLabel = "Anterior",
  nextLabel = "Próxima",
  className,
}: PaginationNavProps) {
  const disabledClass =
    "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground opacity-60";

  return (
    <nav
      className={cn("flex flex-wrap items-center gap-2 pt-4", className)}
      aria-label="Paginação"
    >
      {prevPage !== null ? (
        <Link
          href={buildPrevHref()}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex items-center gap-1.5"
          )}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4 shrink-0" aria-hidden />
          {prevLabel}
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden>
          <ChevronLeft className="size-4 shrink-0" />
          {prevLabel}
        </span>
      )}
      <span className="px-2 text-sm text-muted-foreground" aria-live="polite">
        Página {currentPage} de {totalPages}
      </span>
      {nextPage !== null ? (
        <Link
          href={buildNextHref()}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "inline-flex items-center gap-1.5"
          )}
          aria-label="Próxima página"
        >
          {nextLabel}
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        </Link>
      ) : (
        <span className={disabledClass} aria-hidden>
          {nextLabel}
          <ChevronRight className="size-4 shrink-0" />
        </span>
      )}
    </nav>
  );
}
