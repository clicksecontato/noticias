import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageBackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function PageBackLink({ href, children, className }: PageBackLinkProps) {
  return (
    <p className={cn("mb-4 text-sm text-muted-foreground", className)}>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 no-underline hover:text-foreground hover:no-underline"
      >
        <ChevronLeft className="size-4 shrink-0" aria-hidden />
        <span>{children}</span>
      </Link>
    </p>
  );
}
