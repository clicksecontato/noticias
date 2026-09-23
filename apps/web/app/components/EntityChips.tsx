import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EntityChipsProps {
  subjectNames?: string[];
  tagNames?: string[];
  typeNames?: string[];
  className?: string;
}

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
        <Badge key={`subject-${name}`} variant="soft" className="text-xs font-normal">
          {name}
        </Badge>
      ))}
      {(tagNames ?? []).map((name) => (
        <Badge key={`tag-${name}`} variant="secondary" className="text-xs font-normal">
          {name}
        </Badge>
      ))}
      {(typeNames ?? []).map((name) => (
        <Badge key={`type-${name}`} variant="info" className="text-xs font-normal">
          {name}
        </Badge>
      ))}
    </div>
  );
}
