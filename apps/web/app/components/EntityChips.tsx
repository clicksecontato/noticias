import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EntityChipsProps {
  subjectNames?: string[];
  tagNames?: string[];
  typeNames?: string[];
  className?: string;
}

const chipClass =
  "h-6 min-h-6 rounded-full px-2.5 text-[11px] font-medium leading-none tracking-normal";

export function EntityChips({
  subjectNames,
  tagNames,
  typeNames,
  className,
}: EntityChipsProps) {
  const hasAny =
    (subjectNames?.length ?? 0) > 0 ||
    (tagNames?.length ?? 0) > 0 ||
    (typeNames?.length ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <div
      className={cn("mt-2 flex flex-wrap gap-1.5", className)}
      aria-label="Assuntos, tags e tipos"
    >
      {(subjectNames ?? []).map((name) => (
        <Badge key={`subject-${name}`} variant="soft" className={chipClass}>
          {name}
        </Badge>
      ))}
      {(tagNames ?? []).map((name) => (
        <Badge key={`tag-${name}`} variant="secondary" className={chipClass}>
          {name}
        </Badge>
      ))}
      {(typeNames ?? []).map((name) => (
        <Badge key={`type-${name}`} variant="info" className={chipClass}>
          {name}
        </Badge>
      ))}
    </div>
  );
}
