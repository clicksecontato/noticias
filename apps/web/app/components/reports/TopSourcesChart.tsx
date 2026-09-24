"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { NeoChartContainer } from "@/src/ui/NeoChartContainer";

export interface TopSourcesItem {
  source_id: string;
  source_name: string;
  articles: number;
  videos: number;
  total: number;
}

const chartConfig = {
  source_name: { label: "Fonte" },
  articles: {
    label: "Artigos",
    color: "var(--chart-1)",
  },
  videos: {
    label: "Vídeos",
    color: "var(--chart-2)",
  },
  total: {
    label: "Total",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const MAX_BARS = 15;

interface TopSourcesChartProps {
  data: TopSourcesItem[];
}

export function TopSourcesChart({ data }: TopSourcesChartProps) {
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
            dataKey="source_name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={76}
            tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 18)}…` : v)}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="articles" fill={fillWarm} radius={[0, 8, 8, 0]} stackId="s" />
          <Bar dataKey="videos" fill={fillCool} radius={[0, 8, 8, 0]} stackId="s" />
        </BarChart>
      )}
    </NeoChartContainer>
  );
}
