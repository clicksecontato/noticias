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
import { useChartGradientFills } from "@/src/ui/chart-gradients";

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

interface VolumeChartProps {
  data: VolumeSeriesPoint[];
  groupBy: string;
}

export function VolumeChart({ data, groupBy }: VolumeChartProps) {
  const { defs, fillWarm, fillCool, strokeWarm, strokeCool } = useChartGradientFills();
  if (!data.length) return null;

  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
      <AreaChart data={data} margin={{ left: 12, right: 12 }}>
        {defs}
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
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
          stroke={strokeWarm}
          fill={fillWarm}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="videos"
          stackId="a"
          stroke={strokeCool}
          fill={fillCool}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
