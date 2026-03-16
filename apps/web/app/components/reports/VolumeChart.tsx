"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export interface VolumeSeriesPoint {
  date: string;
  articles: number;
  videos: number;
  total: number;
}

const chartConfig = {
  date: { label: "Data" },
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

interface VolumeChartProps {
  data: VolumeSeriesPoint[];
  groupBy: string;
}

export function VolumeChart({ data, groupBy }: VolumeChartProps) {
  if (!data.length) return null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => {
            if (groupBy === "month") return v.slice(0, 7);
            if (groupBy === "week") return `S${v}`;
            return v;
          }}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="articles"
          stackId="a"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="videos"
          stackId="a"
          stroke="hsl(var(--chart-2))"
          fill="hsl(var(--chart-2))"
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartContainer>
  );
}
