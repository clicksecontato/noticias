"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PIE_COLORS } from "@/src/ui/chart-gradients";

export interface MapaTematicoChartItem {
  cluster_id: string;
  cluster_label: string;
  total: number;
  share_pct: number;
}

const chartConfig = {
  total: { label: "Cobertura" },
} satisfies ChartConfig;

interface MapaTematicoChartProps {
  data: MapaTematicoChartItem[];
  fill?: boolean;
}

export function MapaTematicoChart({ data, fill = false }: MapaTematicoChartProps) {
  const chartData = data.filter((row) => row.total > 0);
  if (!chartData.length) return null;

  const config = chartData.reduce((acc, row, index) => {
    acc[row.cluster_id] = {
      label: row.cluster_label,
      color: PIE_COLORS[index % PIE_COLORS.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <div className={fill ? "flex h-full min-h-0 flex-col gap-8 lg:flex-row lg:items-center" : "space-y-4"}>
      <ChartContainer
        config={{ ...chartConfig, ...config }}
        className={
          fill
            ? "aspect-auto h-full min-h-0 w-full flex-1"
            : "mx-auto min-h-[280px] w-full max-w-md"
        }
      >
        <PieChart>
          <ChartTooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as MapaTematicoChartItem | undefined;
              if (!active || !row) return null;
              return (
                <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-md">
                  <p className="font-medium">{row.cluster_label}</p>
                  <p className="tabular-nums text-muted-foreground">
                    {row.total} · {row.share_pct}%
                  </p>
                </div>
              );
            }}
          />
          <Pie
            data={chartData}
            dataKey="total"
            nameKey="cluster_label"
            cx="50%"
            cy="50%"
            innerRadius={fill ? "42%" : 52}
            outerRadius={fill ? "72%" : 96}
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((row, index) => (
              <Cell key={row.cluster_id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul
        className={
          fill
            ? "grid shrink-0 content-center gap-4 lg:w-[min(28rem,42%)]"
            : "space-y-2"
        }
        aria-label="Legenda dos clusters"
      >
        {chartData.map((row, index) => (
          <li key={row.cluster_id} className="flex items-center gap-3 text-xl">
            <span
              className="size-4 shrink-0 rounded-full"
              style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              aria-hidden
            />
            <span className="min-w-0 font-medium">{row.cluster_label}</span>
            <span className="ml-auto shrink-0 tabular-nums text-muted-foreground">
              {row.share_pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
