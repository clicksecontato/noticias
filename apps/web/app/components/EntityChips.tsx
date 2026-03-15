import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface EntityChipsProps {
  gameNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
  platformNames?: string[];
  className?: string;
}

export function EntityChips({
  gameNames,
  tagNames,
  genreNames,
  platformNames,
  className,
}: EntityChipsProps) {
  const all = [
    ...(gameNames ?? []),
    ...(tagNames ?? []),
    ...(genreNames ?? []),
    ...(platformNames ?? []),
  ];
  if (all.length === 0) return null;

  return (
    <div
      className={cn("mt-2 flex flex-wrap gap-1.5", className)}
      aria-label="Jogos, tags, gêneros e plataformas"
    >
      {all.map((name) => (
        <Badge key={name} variant="secondary" className="text-xs font-normal">
          {name}
        </Badge>
      ))}
    </div>
  );
}
