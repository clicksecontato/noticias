import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { SourceAvatar } from "./SourceAvatar";
import { cn } from "@/lib/utils";

export interface FilterChipItem {
  id: string;
  name: string;
  imageUrl?: string | null;
}

interface FilterChipRowProps {
  items: FilterChipItem[];
  /** Modo single (ex.: /news). */
  activeId?: string | null;
  /** Modo multi: vários canais ativos (ex.: /videos). */
  activeIds?: string[];
  buildHref: (id: string) => string;
  allLabel?: string;
  className?: string;
}

const chipClass =
  "h-8 min-h-8 rounded-full px-3 text-xs font-medium leading-none tracking-normal";

export function FilterChipRow({
  items,
  activeId = null,
  activeIds,
  buildHref,
  allLabel = "Todos",
  className,
}: FilterChipRowProps) {
  const multi = Array.isArray(activeIds);
  const selected = multi ? activeIds : activeId ? [activeId] : [];
  const noneSelected = selected.length === 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link href={buildHref("")} className="no-underline">
        <Badge
          variant={noneSelected ? "default" : "outline"}
          className={chipClass}
        >
          {allLabel}
        </Badge>
      </Link>
      {items.map((item) => {
        const isActive = selected.includes(item.id);
        return (
          <Link key={item.id} href={buildHref(item.id)} className="no-underline">
            <Badge
              variant={isActive ? "default" : "outline"}
              className={cn(chipClass, "inline-flex items-center gap-2")}
              aria-pressed={multi ? isActive : undefined}
            >
              {item.imageUrl ? (
                <SourceAvatar name={item.name} imageUrl={item.imageUrl} size="xs" />
              ) : null}
              <span className="max-w-[14rem] truncate sm:max-w-none">{item.name}</span>
            </Badge>
          </Link>
        );
      })}
    </div>
  );
}
