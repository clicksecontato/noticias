export type SectionHeaderLevel = "page" | "section";

export function sectionHeaderTitleClass(level: SectionHeaderLevel): string {
  if (level === "page") {
    return "text-2xl font-semibold text-foreground sm:text-3xl";
  }
  return "text-xl font-semibold text-foreground";
}

export function sectionHeaderDescriptionClass(): string {
  return "max-w-2xl text-base text-muted-foreground";
}
