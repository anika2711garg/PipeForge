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
        "rounded-md px-3 py-1.5 text-sm",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
