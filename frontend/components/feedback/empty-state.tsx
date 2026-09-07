import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface rounded-[1.5rem] bg-gradient-to-br from-card via-tint/40 to-lavender/50 px-6 py-12 text-center sm:px-10 sm:py-14">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4F7AF0] to-[#305CDE] text-white shadow-[0_10px_24px_rgba(48,92,222,0.28)]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="display mx-auto mt-5 max-w-md text-[1.45rem] sm:text-[1.6rem]">{title}</h3>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
