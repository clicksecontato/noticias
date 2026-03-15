import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SearchFormProps {
  action: string;
  query?: string;
  hiddenFields?: Record<string, string>;
  placeholder?: string;
  label?: string;
  submitLabel?: string;
  className?: string;
}

export function SearchForm({
  action,
  query = "",
  hiddenFields = {},
  placeholder = "Ex.: GTA, Elden Ring...",
  label = "Buscar por termo",
  submitLabel = "Buscar",
  className,
}: SearchFormProps) {
  return (
    <form action={action} method="get" className={className}>
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Label htmlFor="search-q" className="mb-1.5 block">
        {label}
      </Label>
      <div className="flex gap-2">
        <Input
          id="search-q"
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          className="min-w-0 flex-1"
          aria-label={label}
        />
        <Button type="submit" aria-label={submitLabel}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
