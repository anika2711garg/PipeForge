import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("surface rounded-[1.5rem]", className)} {...props} />;
}
