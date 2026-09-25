"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Título de página admin com ícone do menu lateral à esquerda. */
export function AdminPageTitle({
  icon: Icon,
  children,
  className,
  as: Tag = "h1",
  hint,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2";
  /** Texto do tooltip ao apontar para o título. */
  hint?: string;
}) {
  const heading = (
    <Tag
      className={cn(
        "flex items-center gap-2.5 text-2xl font-semibold tracking-tight sm:text-3xl",
        hint && "cursor-help",
        className
      )}
    >
      <Icon className="size-7 shrink-0 text-primary" aria-hidden />
      <span>{children}</span>
    </Tag>
  );

  if (!hint) return heading;

  return (
    <div className="group/title relative w-fit max-w-full">
      {heading}
      <div
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))]",
          "rounded-xl border border-border/80 bg-popover px-3 py-2.5 text-sm font-normal leading-relaxed text-popover-foreground shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "group-hover/title:opacity-100 group-focus-within/title:opacity-100"
        )}
      >
        {hint}
      </div>
    </div>
  );
}
