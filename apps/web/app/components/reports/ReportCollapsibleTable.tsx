"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_PREVIEW_ROWS = 8;

/** Tabela de detalhe com toggle — padrão Fase E dos relatórios. */
export function ReportCollapsibleTable({
  title = "Tabela detalhada",
  rowCount,
  previewRows = DEFAULT_PREVIEW_ROWS,
  defaultOpen,
  children,
  className,
}: {
  title?: string;
  rowCount?: number;
  previewRows?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const autoClosed = rowCount != null && rowCount > previewRows;
  const [open, setOpen] = useState(defaultOpen ?? !autoClosed);

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? (
          <ChevronDown className="size-4 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0" aria-hidden />
        )}
        <span>
          {title}
          {rowCount != null ? (
            <span className="ml-1 tabular-nums text-muted-foreground">({rowCount})</span>
          ) : null}
        </span>
      </Button>
      {open ? <div className="overflow-x-auto">{children}</div> : null}
    </div>
  );
}
