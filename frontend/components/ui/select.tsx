import { cn } from "@/lib/utils/cn";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-card transition-[border-color,box-shadow] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
