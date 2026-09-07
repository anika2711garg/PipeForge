import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="pf-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B7FE0" />
          <stop offset="100%" stopColor="#3A5FCD" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill="url(#pf-mark)" />
      <path
        d="M8.5 22.5V9.5h3.2l5.1 9.4V9.5H20v13h-3.2l-5.1-9.4v9.4H8.5z"
        fill="white"
      />
    </svg>
  );
}

export function Logo({
  collapsed,
  inverse = false,
}: {
  collapsed?: boolean;
  inverse?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <LogoMark />
      {!collapsed ? (
        <div className="min-w-0">
          <p
            className={cn(
              "truncate text-[1.05rem] font-bold tracking-tight",
              inverse ? "text-sidebar-foreground" : "text-foreground",
            )}
          >
            PipeForge
          </p>
          <p className={cn("mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]", inverse ? "text-sidebar-muted" : "text-muted-foreground")}>
            Control center
          </p>
        </div>
      ) : (
        <span className="sr-only">PipeForge</span>
      )}
    </div>
  );
}
