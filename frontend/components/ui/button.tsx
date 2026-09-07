import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

export function Button({
  className,
  variant = "secondary",
  size = "md",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-tight transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.985]",
        variant === "primary" &&
          "bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_12px_28px_rgba(139,92,246,0.4)] hover:brightness-110",
        variant === "secondary" &&
          "bg-gradient-to-r from-cyan-100 to-blue-100 text-blue-800 hover:from-cyan-200 hover:to-blue-200 dark:from-cyan-950 dark:to-blue-950 dark:text-cyan-100",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-blue-100/70 dark:hover:bg-blue-500/10",
        variant === "outline" &&
          "border-2 border-violet-300 bg-white/80 text-violet-800 hover:border-fuchsia-400 hover:bg-fuchsia-50 dark:border-violet-500/40 dark:bg-slate-900/70 dark:text-violet-100",
        variant === "danger" && "bg-gradient-to-r from-rose-500 to-orange-500 text-white hover:brightness-110",
        size === "sm" && "h-9 min-h-9 px-3.5 text-xs",
        size === "md" && "h-11 min-h-11 px-5 text-sm",
        size === "lg" && "h-12 min-h-12 px-5 text-sm",
        size === "icon" && "h-11 w-11 min-h-11 min-w-11",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
