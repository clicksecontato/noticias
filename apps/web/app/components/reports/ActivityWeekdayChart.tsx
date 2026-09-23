"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useChartGradientFills } from "@/src/ui/chart-gradients";

export interface ActivityWeekdayItem {
  weekday: number;
  label: string;
  articles: number;
  videos: number;
  total: number;
}

const chartConfig = {
  articles: {
    label: "Artigos",
    color: "var(--chart-1)",
  },
  videos: {
    label: "Vídeos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface ActivityWeekdayChartProps {
  data: ActivityWeekdayItem[];
}

export function ActivityWeekdayChart({ data }: ActivityWeekdayChartProps) {
  const { defs, fillWarm, fillCool } = useChartGradientFills();
  if (!data.length) return null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
      <BarChart data={data} margin={{ left: 12, right: 12, top: 8 }}>
        {defs}
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-border/40"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="articles" stackId="a" fill={fillWarm} radius={[6, 6, 0, 0]} />
        <Bar dataKey="videos" stackId="a" fill={fillCool} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
