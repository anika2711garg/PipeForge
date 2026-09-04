import type { ReactNode } from "react";

export function Dropdown({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-md border border-border bg-card px-3 py-2 text-sm">
        {label}
      </summary>
      <div className="absolute z-30 mt-1 min-w-40 rounded-md border border-border bg-card p-1 shadow-pop">
        {children}
      </div>
    </details>
  );
}
