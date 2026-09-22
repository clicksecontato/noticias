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
  const all = [
    ...(subjectNames ?? []),
    ...(tagNames ?? []),
    ...(typeNames ?? []),
  ];
  if (all.length === 0) return null;

  return (
    <div
      className={cn("mt-2 flex flex-wrap gap-1.5", className)}
      aria-label="Assuntos, tags e tipos"
    >
      {all.map((name) => (
        <Badge key={name} variant="secondary" className="text-xs font-normal">
          {name}
        </Badge>
      ))}
    </div>
  );
}
