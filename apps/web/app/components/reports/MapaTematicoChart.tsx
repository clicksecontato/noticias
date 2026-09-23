"use client";

import { Cell, Pie, PieChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface MapaTematicoChartItem {
  cluster_id: string;
  cluster_label: string;
  total: number;
  share_pct: number;
}

const pieColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

const chartConfig = {
  total: { label: "Cobertura" },
} satisfies ChartConfig;

interface MapaTematicoChartProps {
  data: MapaTematicoChartItem[];
}

export function MapaTematicoChart({ data }: MapaTematicoChartProps) {
  const chartData = data.filter((row) => row.total > 0);
  if (!chartData.length) return null;

  const config = chartData.reduce((acc, row, index) => {
    acc[row.cluster_id] = {
      label: row.cluster_label,
      color: pieColors[index % pieColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={{ ...chartConfig, ...config }} className="mx-auto min-h-[280px] w-full max-w-md">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, _name, item) => {
                const row = item?.payload as MapaTematicoChartItem | undefined;
                return (
                  <span>
                    {Number(value)} ({row?.share_pct ?? 0}%)
                  </span>
                );
              }}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="cluster_label"
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={96}
          paddingAngle={2}
        >
          {chartData.map((row, index) => (
            <Cell
              key={row.cluster_id}
              fill={pieColors[index % pieColors.length]}
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="cluster_label" />} />
      </PieChart>
    </ChartContainer>
  );
}
