"use client";

import { LayoutGroup, motion } from "framer-motion";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/providers/preferences-provider";

import { Button } from "../ui/button";
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
  const { preferences, update } = usePreferences();
  const collapsed = preferences.sidebarCollapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[236px]",
        mobileOpen === false && "max-lg:hidden",
      )}
    >
      <div className={cn("flex h-16 items-center px-4", collapsed && "justify-center px-2")}>
        <Logo collapsed={collapsed} />
      </div>
      <nav className="flex-1 space-y-7 overflow-auto px-2 py-3" aria-label="Primary">
        <LayoutGroup id="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed ? (
              <p className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/30">
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
                      "relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "text-sidebar-foreground"
                        : "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      collapsed && "justify-center px-0",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-primary/15"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <item.icon className="relative z-10 h-4 w-4 shrink-0" aria-hidden="true" />
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
      <div className="p-2 max-lg:hidden">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-center text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
