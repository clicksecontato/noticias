"use client";

import type { ReactNode } from "react";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import {
  useChartGradientFills,
  type ChartGradientFills,
} from "@/src/ui/chart-gradients";

/** ChartContainer com fills de degradê únicos — defs vão dentro do BarChart/AreaChart. */
export function NeoChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: (fills: ChartGradientFills) => ReactNode;
}) {
  const fills = useChartGradientFills();
  return (
    <ChartContainer config={config} className={className}>
      {children(fills)}
    </ChartContainer>
  );
}
