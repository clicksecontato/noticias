"use client";

import { Cell, Pie, PieChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { NeoChartContainer } from "@/src/ui/NeoChartContainer";
import type {
  SourceFreshnessBar,
  SourceHealthSlice,
} from "@/src/admin/source-status-chart";

const healthConfig = {
  value: { label: "Fontes" },
  ok: { label: "Em dia", color: "#d4a574" },
  stale: { label: "Atrasada", color: "#c4784a" },
} satisfies ChartConfig;

const freshnessConfig = {
  hoursAgo: { label: "Horas", color: "#d4a574" },
} satisfies ChartConfig;

export function SourceHealthDonut({
  slices,
  total,
}: {
  slices: SourceHealthSlice[];
  total: number;
}) {
  if (slices.length === 0) return null;
  const ok = slices.find((s) => s.key === "ok")?.value ?? 0;
  const pct = total > 0 ? Math.round((ok / total) * 100) : 0;

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <ChartContainer config={healthConfig} className="aspect-square h-[220px] w-full">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => {
                  const row = item?.payload as SourceHealthSlice | undefined;
                  return (
                    <span>
                      {row?.label}: {Number(value)}
                    </span>
                  );
                }}
              />
            }
          />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={88}
            paddingAngle={3}
            strokeWidth={0}
          >
            {slices.map((s) => (
              <Cell key={s.key} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold tabular-nums text-primary">{pct}%</p>
        <p className="text-xs text-muted-foreground">em dia</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground/80">
          {total} fonte{total === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}

export function SourceFreshnessBars({ bars }: { bars: SourceFreshnessBar[] }) {
  if (bars.length === 0) return null;
  const height = Math.max(180, bars.length * 36);

  return (
    <NeoChartContainer
      config={freshnessConfig}
      className="aspect-auto w-full min-h-0"
    >
      {({ defs, fillWarm }) => (
        <BarChart
          data={bars}
          layout="vertical"
          margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
          height={height}
        >
          {defs}
          <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.06)" />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#9a9288", fontSize: 11 }}
            unit="h"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#c4bdb4", fontSize: 11 }}
          />
          <ChartTooltip
            cursor={{ fill: "rgba(212,165,116,0.08)" }}
            content={
              <ChartTooltipContent
                formatter={(value, _name, item) => {
                  const row = item?.payload as SourceFreshnessBar | undefined;
                  return (
                    <span>
                      {Number(value)}h
                      {row?.stale ? " · atrasada" : " · em dia"}
                    </span>
                  );
                }}
              />
            }
          />
          <Bar
            dataKey="hoursAgo"
            radius={[0, 8, 8, 0]}
            fill={fillWarm}
            maxBarSize={18}
          />
        </BarChart>
      )}
    </NeoChartContainer>
  );
}
