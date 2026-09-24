import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Título de página admin com ícone do menu lateral à esquerda. */
export function AdminPageTitle({
  icon: Icon,
  children,
  className,
  as: Tag = "h1",
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <Tag
      className={cn(
        "flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl",
        className
      )}
    >
      <Icon className="size-7 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </Tag>
  );
}
