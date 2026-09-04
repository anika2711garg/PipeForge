"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ErrorBoundary } from "@/components/feedback/error-boundary";
import { useMediaQuery } from "@/hooks/use-media-query";

import { ApiBanner } from "./api-banner";
import { Atmosphere } from "./atmosphere";
import { CommandPalette } from "./command-palette";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[248px] shadow-pop">
            <Sidebar mobileOpen onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Atmosphere />
        <Header onOpenNav={() => setMobileOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
        <ApiBanner />
        <main className="scrollbar-thin relative z-10 flex-1 overflow-auto">
          <motion.div
            key={pathname}
            className="mx-auto w-full max-w-[1180px] px-4 py-8 md:px-10 md:py-12"
            initial={reduce ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <ErrorBoundary>{children}</ErrorBoundary>
          </motion.div>
        </main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
