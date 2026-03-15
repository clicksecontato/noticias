import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SortMode = "published_desc" | "published_asc";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "published_desc", label: "Mais novas" },
  { value: "published_asc", label: "Mais antigas" },
];

interface SortChipsProps {
  currentSort: SortMode;
  buildHref: (sortMode: SortMode) => string;
  className?: string;
}

export function SortChips({ currentSort, buildHref, className }: SortChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {SORT_OPTIONS.map(({ value, label }) => (
        <Link key={value} href={buildHref(value)}>
          <Badge variant={currentSort === value ? "default" : "outline"} className="font-normal">
            {label}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
