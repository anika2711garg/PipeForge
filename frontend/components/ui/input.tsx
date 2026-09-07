import { cn } from "@/lib/utils/cn";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm text-foreground shadow-card transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        className,
      )}
      {...props}
    />
  );
}
