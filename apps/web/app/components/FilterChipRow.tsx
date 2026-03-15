import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterChipItem {
  id: string;
  name: string;
}

interface FilterChipRowProps {
  items: FilterChipItem[];
  activeId: string | null;
  buildHref: (id: string) => string;
  allLabel?: string;
  className?: string;
}

export function FilterChipRow({
  items,
  activeId,
  buildHref,
  allLabel = "Todos",
  className,
}: FilterChipRowProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link href={buildHref("")}>
        <Badge variant={!activeId ? "default" : "outline"} className="font-normal">
          {allLabel}
        </Badge>
      </Link>
      {items.map((item) => (
        <Link key={item.id} href={buildHref(item.id)}>
          <Badge variant={activeId === item.id ? "default" : "outline"} className="font-normal">
            {item.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
