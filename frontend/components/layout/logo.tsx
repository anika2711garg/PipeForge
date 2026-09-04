import { cn } from "@/lib/utils/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex h-8 w-8", className)}>
      <span className="absolute inset-0 rounded-xl bg-primary/30 motion-safe:animate-pulse-soft" aria-hidden="true" />
      <svg viewBox="0 0 32 32" className="relative h-8 w-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" className="fill-primary" />
        <path
          d="M8 22V10h3.8l4.2 7.1V10H20v12h-3.7L12.2 14.8V22H8z"
          className="fill-primary-foreground"
        />
      </svg>
    </span>
  );
}

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
      <LogoMark />
      {!collapsed ? (
        <div className="min-w-0 leading-none">
          <p className="font-display text-[1.4rem] text-sidebar-foreground">PipeForge</p>
        </div>
      ) : null}
    </div>
  );
}
