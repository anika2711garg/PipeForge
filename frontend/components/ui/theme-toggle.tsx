"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 w-[7.2rem] rounded-md bg-muted" aria-hidden="true" />;
  }

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  return (
    <div
      className="relative inline-flex rounded-md border border-border bg-card p-0.5"
      role="group"
      aria-label="Theme"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          aria-label={`${label} theme`}
          onClick={() => setTheme(value)}
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors duration-200",
            theme === value ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {theme === value ? (
            <motion.span
              layoutId={reduce ? undefined : "theme-active"}
              className="absolute inset-0 rounded-sm bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              aria-hidden="true"
            />
          ) : null}
          <Icon className="relative z-10 h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
