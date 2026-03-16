"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface ByTagsItem {
  tag_id: string;
  tag_name: string;
  count: number;
}

const chartConfig = {
  tag_name: { label: "Tag" },
  count: {
    label: "Notícias",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const MAX_BARS = 20;

interface TagsChartProps {
  data: ByTagsItem[];
}

export function TagsChart({ data }: TagsChartProps) {
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
          dataKey="tag_name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={76}
          tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 20)}…` : v)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
