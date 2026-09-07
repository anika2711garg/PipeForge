import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-foreground",
        className,
      )}
      {...props}
    />
  );
}
