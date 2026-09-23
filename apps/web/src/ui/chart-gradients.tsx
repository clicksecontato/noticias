"use client";

import { useId, type ReactElement } from "react";

/**
 * Gradientes luminosos (exemplo-layout-final):
 * warm = gold/bronze; cool = verde → ciano; amber = cream-gold.
 */
const HEX = {
  warmTop: "#e8c49a",
  warmMid: "#d4a574",
  warmBot: "#a67c52",
  coolTop: "#00e5c8",
  coolMid: "#00c853",
  coolBot: "#007a3d",
  amberTop: "#f0d4a8",
  amberBot: "#d4a574",
} as const;

export const PIE_COLORS = [
  HEX.warmMid,
  HEX.coolMid,
  HEX.amberBot,
  "#8a8a8a",
  "#ff4d4d",
  HEX.coolTop,
] as const;

export type ChartGradientFills = {
  defs: ReactElement;
  fillWarm: string;
  fillCool: string;
  fillAmber: string;
  strokeWarm: string;
  strokeCool: string;
};

export function useChartGradientFills(): ChartGradientFills {
  const uid = useId().replace(/:/g, "");
  const warmId = `cg-warm-${uid}`;
  const coolId = `cg-cool-${uid}`;
  const amberId = `cg-amber-${uid}`;

  return {
    defs: (
      <defs>
        <linearGradient id={warmId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={HEX.warmBot} stopOpacity={1} />
          <stop offset="45%" stopColor={HEX.warmMid} stopOpacity={1} />
          <stop offset="100%" stopColor={HEX.warmTop} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={coolId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={HEX.coolBot} stopOpacity={1} />
          <stop offset="45%" stopColor={HEX.coolMid} stopOpacity={1} />
          <stop offset="100%" stopColor={HEX.coolTop} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={amberId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={HEX.amberBot} stopOpacity={1} />
          <stop offset="100%" stopColor={HEX.amberTop} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`${warmId}-h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={HEX.warmMid} />
          <stop offset="100%" stopColor={HEX.warmTop} />
        </linearGradient>
        <linearGradient id={`${coolId}-h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={HEX.coolMid} />
          <stop offset="100%" stopColor={HEX.coolTop} />
        </linearGradient>
      </defs>
    ),
    fillWarm: `url(#${warmId})`,
    fillCool: `url(#${coolId})`,
    fillAmber: `url(#${amberId})`,
    strokeWarm: HEX.warmMid,
    strokeCool: HEX.coolMid,
  };
}
