import { cn } from "@/lib/utils";
import {
  sectionHeaderDescriptionClass,
  sectionHeaderTitleClass,
  type SectionHeaderLevel,
} from "@/src/ui/section-header";

interface SectionHeaderProps {
  title: string;
  description?: string;
  level?: SectionHeaderLevel;
  className?: string;
  actions?: React.ReactNode;
}

export function SectionHeader({
  title,
  description,
  level = "section",
  className,
  actions,
}: SectionHeaderProps) {
  const Heading = level === "page" ? "h1" : "h2";

  return (
    <header
      className={cn(
        "relative flex flex-wrap items-end justify-between gap-3 border-b border-border/70 pb-4 pl-3",
        className
      )}
    >
      <div className="accent-bar rounded-full" aria-hidden />
      <div className="space-y-1.5">
        <Heading className={sectionHeaderTitleClass(level)}>{title}</Heading>
        {description ? (
          <p className={sectionHeaderDescriptionClass()}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
