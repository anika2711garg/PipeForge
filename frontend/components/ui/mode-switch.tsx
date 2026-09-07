"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

export function ModeSwitch({
  showLabel = true,
  inverse = false,
  className,
}: {
  showLabel?: boolean;
  inverse?: boolean;
  className?: string;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      disabled={!mounted}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-1 text-sm transition-colors duration-200",
        inverse
          ? "hover:bg-sidebar-accent"
          : "hover:bg-tint",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border p-0.5",
          inverse
            ? dark
              ? "border-sidebar-border bg-primary/35"
              : "border-sidebar-border bg-sidebar-accent"
            : dark
              ? "border-border bg-primary/20"
              : "border-border bg-tint",
        )}
      >
        <motion.span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card"
          animate={{ x: dark ? 20 : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 28 }}
        >
          {mounted ? (
            dark ? (
              <Moon className="h-3 w-3 motion-safe:animate-icon-pop" aria-hidden="true" />
            ) : (
              <Sun className="h-3 w-3 motion-safe:animate-icon-pop" aria-hidden="true" />
            )
          ) : null}
        </motion.span>
      </span>
      {showLabel ? (
        <span
          className={cn(
            "hidden min-w-[2.6rem] text-xs sm:inline",
            inverse ? "text-sidebar-muted" : "text-muted-foreground",
          )}
        >
          {mounted ? (dark ? "Dark" : "Light") : "Theme"}
        </span>
      ) : (
        <span className="sr-only">{mounted ? (dark ? "Dark mode" : "Light mode") : "Theme"}</span>
      )}
    </button>
  );
}
