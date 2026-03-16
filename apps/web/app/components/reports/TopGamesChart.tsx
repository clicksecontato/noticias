"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface TopGamesItem {
  game_id: string;
  game_name: string;
  articles: number;
  videos: number;
  total: number;
}

const chartConfig = {
  game_name: { label: "Jogo" },
  articles: {
    label: "Artigos",
    color: "hsl(var(--chart-1))",
  },
  videos: {
    label: "Vídeos",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "Total",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

const MAX_BARS = 15;

interface TopGamesChartProps {
  data: TopGamesItem[];
}

export function TopGamesChart({ data }: TopGamesChartProps) {
  const chartData = data.slice(0, MAX_BARS);
  if (!chartData.length) return null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 80, right: 12, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          type="category"
          dataKey="game_name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={76}
          tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 18)}…` : v)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="articles" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} stackId="s" />
        <Bar dataKey="videos" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} stackId="s" />
      </BarChart>
    </ChartContainer>
  );
}
