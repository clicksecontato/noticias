import Link from "next/link";
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
  prevLabel = "Página anterior",
  nextLabel = "Próxima página",
  className,
}: PaginationNavProps) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-2 pt-4", className)}
      aria-label="Paginação"
    >
      {prevPage !== null ? (
        <Link
          href={buildPrevHref()}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          aria-label="Página anterior"
        >
          {prevLabel}
        </Link>
      ) : (
        <span className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground" aria-hidden>
          {prevLabel}
        </span>
      )}
      <span className="px-2 text-sm text-muted-foreground" aria-live="polite">
        Página {currentPage} de {totalPages}
      </span>
      {nextPage !== null ? (
        <Link
          href={buildNextHref()}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          aria-label="Próxima página"
        >
          {nextLabel}
        </Link>
      ) : (
        <span className="rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground" aria-hidden>
          {nextLabel}
        </span>
      )}
    </nav>
  );
}
