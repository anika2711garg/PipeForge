"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  return useMemo(
    () => ({
      grid: dark ? "hsl(222 18% 18%)" : "hsl(28 16% 86%)",
      text: dark ? "hsl(220 12% 68%)" : "hsl(222 12% 38%)",
      primary: dark ? "hsl(24 96% 58%)" : "hsl(22 88% 42%)",
      info: dark ? "hsl(200 92% 68%)" : "hsl(205 80% 38%)",
      success: dark ? "hsl(160 72% 46%)" : "hsl(160 70% 28%)",
      warning: dark ? "hsl(38 96% 58%)" : "hsl(32 95% 42%)",
      tooltipBg: dark ? "hsl(222 32% 8%)" : "hsl(0 0% 100%)",
      tooltipBorder: dark ? "hsl(222 18% 16%)" : "hsl(28 16% 86%)",
    }),
    [dark],
  );
}
