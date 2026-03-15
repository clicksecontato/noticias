import Link from "next/link";
import { cn } from "@/lib/utils";

interface PageBackLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function PageBackLink({ href, children, className }: PageBackLinkProps) {
  return (
    <p className={cn("mb-4 text-sm text-muted-foreground", className)}>
      <Link href={href} className="hover:text-foreground hover:underline">
        {children}
      </Link>
    </p>
  );
}
