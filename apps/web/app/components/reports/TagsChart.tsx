"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { NeoChartContainer } from "@/src/ui/NeoChartContainer";

export interface ByTagsItem {
  tag_id: string;
  tag_name: string;
  count: number;
}

const chartConfig = {
  tag_name: { label: "Tag" },
  count: {
    label: "Notícias",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const MAX_BARS = 20;

interface TagsChartProps {
  data: ByTagsItem[];
  fill?: boolean;
  onTagClick?: (item: ByTagsItem) => void;
}

export function TagsChart({ data, fill = false, onTagClick }: TagsChartProps) {
  const chartData = data.slice(0, MAX_BARS);
  if (!chartData.length) return null;

  return (
    <NeoChartContainer
      config={chartConfig}
      className={fill ? "aspect-auto h-full min-h-0 w-full" : "min-h-[300px] w-full"}
    >
      {({ defs, fillWarm }) => (
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
            dataKey="tag_name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={76}
            tickFormatter={(v) => (v.length > 22 ? `${v.slice(0, 20)}…` : v)}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            fill={fillWarm}
            radius={[0, 8, 8, 0]}
            style={onTagClick ? { cursor: "pointer" } : undefined}
            onClick={(bar) => {
              const raw = bar as (ByTagsItem & { payload?: ByTagsItem }) | undefined;
              const row = raw?.payload?.tag_id ? raw.payload : raw;
              if (row?.tag_id) onTagClick?.(row);
            }}
          />
        </BarChart>
      )}
    </NeoChartContainer>
  );
}
