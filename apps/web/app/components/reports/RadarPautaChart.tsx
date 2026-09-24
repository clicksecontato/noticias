"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { NeoChartContainer } from "@/src/ui/NeoChartContainer";

export interface RadarPautaChartItem {
  subject_name: string;
  delta: number;
  total: number;
  previous_total: number;
  trend: string;
}

const chartConfig = {
  subject_name: { label: "Assunto" },
  delta: {
    label: "Variação",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const MAX_BARS = 15;

interface RadarPautaChartProps {
  data: RadarPautaChartItem[];
}

export function RadarPautaChart({ data }: RadarPautaChartProps) {
  const chartData = data.slice(0, MAX_BARS);
  if (!chartData.length) return null;

  return (
    <NeoChartContainer config={chartConfig} className="min-h-[300px] w-full">
      {({ defs, fillWarm, fillCool }) => (
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 80, right: 12, top: 4, bottom: 4 }}
        >
          {defs}
          <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
          <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            type="category"
            dataKey="subject_name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={76}
            tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 18)}…` : v)}
          />
          <ReferenceLine x={0} className="stroke-border" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="delta" radius={[0, 8, 8, 0]}>
            {chartData.map((row, index) => (
              <Cell
                key={`${row.subject_name}-${index}`}
                fill={
                  row.delta > 0
                    ? fillWarm
                    : row.delta < 0
                      ? fillCool
                      : "var(--muted-foreground)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      )}
    </NeoChartContainer>
  );
}
