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
        "relative flex h-full flex-col overflow-hidden text-white transition-[width] duration-200 ease-out",
        "bg-[linear-gradient(165deg,#1d4ed8_0%,#4c1d95_48%,#0f766e_100%)]",
        collapsed ? "w-[76px]" : "w-[268px]",
        mobileOpen === false && "max-lg:hidden",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle at 10% 0%, rgba(255,255,255,0.28), transparent 40%), radial-gradient(circle at 90% 90%, rgba(251,146,60,0.28), transparent 35%)",
        }}
      />
      <div className={cn("relative z-10 flex h-16 items-center border-b border-white/15 px-5", collapsed && "justify-center px-2")}>
        <Logo collapsed={collapsed} inverse />
      </div>

      <nav className="relative z-10 flex-1 space-y-7 overflow-auto px-3 py-5" aria-label="Primary">
        <LayoutGroup id="sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed ? (
                <p className="mb-2.5 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-100/75">
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
                        active ? "font-bold text-white" : "text-sky-100/80 hover:bg-white/10 hover:text-white",
                        collapsed && "justify-center px-0",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {active ? (
                        <motion.span
                          layoutId={reduce ? undefined : "nav-active"}
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 via-fuchsia-500 to-violet-500 shadow-[0_10px_28px_rgba(244,114,182,0.45)]"
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

      <div className="relative z-10 space-y-1 border-t border-white/15 p-3">
        <div className={cn("flex", collapsed ? "justify-center" : "px-1")}>
          <ModeSwitch showLabel={!collapsed} inverse />
        </div>
        <Button
          type="button"
          variant="ghost"
          className="hidden w-full justify-center text-sky-100/80 hover:bg-white/10 hover:text-white lg:inline-flex"
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
