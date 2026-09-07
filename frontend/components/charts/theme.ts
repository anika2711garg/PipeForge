"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== "light";
  return useMemo(
    () => ({
      grid: dark ? "hsl(222 20% 20%)" : "hsl(214 22% 89%)",
      text: dark ? "hsl(215 14% 68%)" : "hsl(218 16% 40%)",
      primary: dark ? "hsl(225 82% 68%)" : "hsl(225 71% 53%)",
      info: dark ? "hsl(225 80% 74%)" : "hsl(225 71% 42%)",
      success: dark ? "hsl(158 42% 56%)" : "hsl(158 48% 28%)",
      warning: dark ? "hsl(34 72% 62%)" : "hsl(32 78% 36%)",
      tooltipBg: dark ? "hsl(222 32% 11%)" : "hsl(0 0% 100%)",
      tooltipBorder: dark ? "hsl(222 20% 20%)" : "hsl(214 22% 89%)",
    }),
    [dark],
  );
}
