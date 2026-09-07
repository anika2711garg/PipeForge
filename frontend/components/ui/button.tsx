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
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.985]",
        variant === "primary" &&
          "bg-[#3A5FCD] text-white shadow-[0_10px_24px_rgba(58,95,205,0.28)] hover:bg-[#2f4fb0] hover:shadow-[0_14px_28px_rgba(58,95,205,0.34)]",
        variant === "secondary" &&
          "bg-[#eef2f8] text-[#1c2740] hover:bg-[#e3eaf6] dark:bg-tint dark:text-foreground dark:hover:bg-tint/80",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-[#eef2f8] dark:hover:bg-tint",
        variant === "outline" &&
          "border border-[#c9d4e8] bg-white/80 text-[#1c2740] backdrop-blur-sm hover:border-[#3A5FCD]/40 hover:bg-[#f5f7fb] dark:border-border dark:bg-card/70 dark:text-foreground",
        variant === "danger" && "bg-[#c4474a] text-white hover:bg-[#a93b3e]",
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
