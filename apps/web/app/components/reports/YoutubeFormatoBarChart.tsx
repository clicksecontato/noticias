"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { NeoChartContainer } from "@/src/ui/NeoChartContainer";

export interface YoutubeFormatoBarRow {
  key?: string;
  label: string;
  count: number;
  hours?: number;
}

const countConfig = {
  count: { label: "Vídeos", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function YoutubeFormatoBarChart({
  rows,
  fill = false,
  onBarClick,
}: {
  rows: YoutubeFormatoBarRow[];
  fill?: boolean;
  onBarClick?: (row: YoutubeFormatoBarRow) => void;
}) {
  const chartData = rows.filter((row) => row.count > 0);
  if (chartData.length === 0) return null;

  const vertical = chartData.length > 4 || chartData.some((row) => row.label.length > 18);
  const config = countConfig;
  const height = vertical ? Math.max(220, chartData.length * 36) : 240;
  const tick = fill ? { fontSize: 18 } : { fontSize: 12 };

  return (
    <div className={fill ? "h-full w-full" : "w-full"} style={fill ? undefined : { height }}>
    <NeoChartContainer config={config} className="aspect-auto h-full w-full">
      {({ defs, fillWarm }) => (
        <BarChart
          data={chartData}
          layout={vertical ? "vertical" : "horizontal"}
          margin={vertical ? { left: 8, right: 12, top: 4, bottom: 4 } : { left: 8, right: 8, top: 8 }}
        >
          {defs}
          <CartesianGrid
            strokeDasharray="3 3"
            className="stroke-border/40"
            horizontal={!vertical}
            vertical={vertical}
          />
          {vertical ? (
            <XAxis type="number" tick={tick} tickLine={false} axisLine={false} tickMargin={8} />
          ) : (
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} tickMargin={8} interval={0} />
          )}
          {vertical ? (
            <YAxis
              type="category"
              dataKey="label"
              tick={tick}
              tickLine={false}
              axisLine={false}
              width={fill ? 160 : 108}
              tickFormatter={(label: string) =>
                label.length > (fill ? 22 : 16) ? `${label.slice(0, fill ? 20 : 14)}…` : label
              }
            />
          ) : (
            <YAxis tick={tick} tickLine={false} axisLine={false} tickMargin={8} width={fill ? 48 : 32} />
          )}
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            fill={fillWarm}
            radius={vertical ? [0, 8, 8, 0] : [8, 8, 0, 0]}
            style={onBarClick ? { cursor: "pointer" } : undefined}
            onClick={(bar) => {
              const raw = bar as (YoutubeFormatoBarRow & { payload?: YoutubeFormatoBarRow }) | undefined;
              const row = raw?.payload?.label ? raw.payload : raw;
              if (row?.label) onBarClick?.(row);
            }}
          />
        </BarChart>
      )}
    </NeoChartContainer>
    </div>
  );
}
