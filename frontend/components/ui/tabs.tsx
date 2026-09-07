import { cn } from "@/lib/utils/cn";
import type { ButtonHTMLAttributes } from "react";

export function TabButton({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "relative rounded-xl px-3.5 py-2 text-sm font-medium transition-[color,background-color,box-shadow] duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-card"
          : "text-muted-foreground hover:bg-tint hover:text-foreground",
        className,
      )}
      aria-pressed={active}
      {...props}
    />
  );
}
