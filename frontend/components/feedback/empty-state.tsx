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
    <div className="surface rounded-[1.5rem] px-6 py-12 text-center sm:px-10 sm:py-14">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2f8] text-[#3A5FCD]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="display mx-auto mt-5 max-w-md text-[1.4rem] sm:text-[1.55rem]">{title}</h3>
      <p className="mx-auto mt-2.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
