"use client";

import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/providers/preferences-provider";

import { Button } from "../ui/button";
import { ModeSwitch } from "../ui/mode-switch";
import { Tooltip } from "../ui/tooltip";
import { Logo } from "./logo";
import { NAV_GROUPS } from "./nav-items";

export function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { preferences, update } = usePreferences();
  const collapsed = preferences.sidebarCollapsed;

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col overflow-hidden text-sidebar-foreground transition-[width] duration-200 ease-out",
        "bg-[linear-gradient(180deg,#141c2e_0%,#182234_55%,#1a2438_100%)]",
        collapsed ? "w-[76px]" : "w-[252px]",
        mobileOpen === false && "max-lg:hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(58,95,205,0.35), transparent 48%), radial-gradient(circle at 90% 90%, rgba(160,140,110,0.12), transparent 40%)",
        }}
      />
      <div className={cn("relative z-10 flex h-16 items-center border-b border-white/8 px-5", collapsed && "justify-center px-2")}>
        <Logo collapsed={collapsed} inverse />
      </div>

      <nav className="relative z-10 flex-1 space-y-8 overflow-auto px-3 py-5" aria-label="Primary">
        <LayoutGroup id="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <p className="mb-2.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted">
                  {group.label}
                </p>
              ) : null}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13.5px] transition-colors duration-200",
                        active
                          ? "font-semibold text-white"
                          : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground",
                        collapsed && "justify-center px-0",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {active ? (
                        <motion.span
                          layoutId={reduce ? undefined : "nav-active"}
                          className="absolute inset-0 rounded-xl bg-[#3A5FCD] shadow-[0_8px_22px_rgba(58,95,205,0.35)]"
                          transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <item.icon className="relative z-10 h-[17px] w-[17px] shrink-0" aria-hidden="true" />
                      {!collapsed ? <span className="relative z-10">{item.label}</span> : <span className="sr-only">{item.label}</span>}
                    </Link>
                  );
                  return collapsed ? (
                    <Tooltip key={item.href} content={item.label}>
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  );
                })}
              </div>
            </div>
          ))}
        </LayoutGroup>
      </nav>

      <div className="relative z-10 space-y-1 border-t border-white/8 p-3">
        <div className={cn("flex", collapsed ? "justify-center" : "px-1")}>
          <ModeSwitch showLabel={!collapsed} inverse />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="hidden w-full justify-center text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground lg:inline-flex"
          onClick={() => update({ sidebarCollapsed: !collapsed })}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed ? <span>Collapse</span> : null}
        </Button>
      </div>
    </aside>
  );
}
