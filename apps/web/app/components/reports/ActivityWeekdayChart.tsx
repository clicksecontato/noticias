"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
    color: "hsl(var(--chart-1))",
  },
  videos: {
    label: "Vídeos",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

interface ActivityWeekdayChartProps {
  data: ActivityWeekdayItem[];
}

export function ActivityWeekdayChart({ data }: ActivityWeekdayChartProps) {
  if (!data.length) return null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[260px] w-full">
      <BarChart data={data} margin={{ left: 12, right: 12, top: 8 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          className="stroke-muted"
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
        <Bar dataKey="articles" stackId="a" fill="hsl(var(--chart-1))" />
        <Bar dataKey="videos" stackId="a" fill="hsl(var(--chart-2))" />
      </BarChart>
    </ChartContainer>
  );
}

