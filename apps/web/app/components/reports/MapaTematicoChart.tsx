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
}

export function MapaTematicoChart({ data }: MapaTematicoChartProps) {
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
          innerRadius={52}
          outerRadius={96}
          paddingAngle={2}
          strokeWidth={0}
        >
          {chartData.map((row, index) => (
            <Cell
              key={row.cluster_id}
              fill={PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="cluster_label" />} />
      </PieChart>
    </ChartContainer>
  );
}
