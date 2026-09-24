import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReportKpi } from "@/src/reports/report-view-insights";

export function ReportKpiStrip({
  items,
  className,
}: {
  items: ReportKpi[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2",
        items.length >= 4 ? "xl:grid-cols-4" : items.length === 3 ? "xl:grid-cols-3" : "",
        className
      )}
    >
      {items.map((kpi, idx) => (
        <Card
          key={`${kpi.label}-${idx}`}
          className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 border-border/70 bg-card/80"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <CardHeader className="pb-1.5 pt-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{kpi.value}</p>
            {kpi.note ? (
              <p className="mt-1 truncate text-xs text-muted-foreground" title={kpi.note}>
                {kpi.note}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReportInsight({
  title = "Leitura em 30 segundos",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-[color-mix(in_srgb,var(--primary)_28%,transparent)] bg-[linear-gradient(135deg,rgba(232,196,154,0.12),transparent_70%)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  );
}

export function ReportSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border-border/70", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">{children}</CardContent>
    </Card>
  );
}

export function ReportTrendBadge({
  trend,
}: {
  trend: "up" | "down" | "new" | "stable" | string;
}) {
  const map: Record<string, { label: string; className: string }> = {
    up: {
      label: "Alta",
      className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    },
    down: {
      label: "Queda",
      className: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    },
    new: {
      label: "Novo",
      className: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
    },
    stable: {
      label: "Estável",
      className: "bg-muted text-muted-foreground ring-border",
    },
  };
  const conf = map[trend] ?? { label: trend, className: "bg-muted text-muted-foreground ring-border" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        conf.className
      )}
    >
      {conf.label}
    </span>
  );
}
