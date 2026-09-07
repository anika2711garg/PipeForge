import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-tint", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/8 to-transparent motion-safe:animate-shimmer" />
    </div>
  );
}
