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
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium tracking-tight transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-55 motion-safe:hover:-translate-y-0.5",
        variant === "primary" && "bg-primary text-primary-foreground shadow-card hover:brightness-110",
        variant === "secondary" && "bg-muted text-foreground hover:bg-muted/80",
        variant === "ghost" && "bg-transparent text-foreground hover:bg-muted",
        variant === "outline" && "border border-border bg-card/70 hover:bg-muted",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:brightness-110",
        size === "sm" && "h-8 px-2.5 text-xs",
        size === "md" && "h-10 px-3.5 text-sm",
        size === "lg" && "h-11 px-5 text-sm",
        size === "icon" && "h-10 w-10 hover:translate-y-0",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
