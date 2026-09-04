import { cn } from "@/lib/utils/cn";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 rounded-xl border border-input bg-card/60 px-3 text-sm text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
