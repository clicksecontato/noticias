"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface TopSubjectsItem {
  subject_id: string;
  subject_name: string;
  articles: number;
  videos: number;
  total: number;
}

const chartConfig = {
  subject_name: { label: "Assunto" },
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

interface TopSubjectsChartProps {
  data: TopSubjectsItem[];
}

export function TopSubjectsChart({ data }: TopSubjectsChartProps) {
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
          dataKey="subject_name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={76}
          tickFormatter={(v) => (v.length > 20 ? `${v.slice(0, 18)}…` : v)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="articles" fill="var(--chart-1)" radius={[0, 4, 4, 0]} stackId="s" />
        <Bar dataKey="videos" fill="var(--chart-2)" radius={[0, 4, 4, 0]} stackId="s" />
      </BarChart>
    </ChartContainer>
  );
}
