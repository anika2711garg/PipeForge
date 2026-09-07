"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { ErrorBoundary } from "@/components/feedback/error-boundary";
import { useMediaQuery } from "@/hooks/use-media-query";

import { AmbientBackdrop } from "./ambient-backdrop";
import { ApiBanner } from "./api-banner";
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
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="relative flex min-h-screen">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[2px]"
              aria-label="Close navigation"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="relative h-full w-[min(100%,280px)] shadow-pop"
              initial={reduce ? false : { x: -28, opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Sidebar mobileOpen onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <AmbientBackdrop />
        <Header onOpenNav={() => setMobileOpen(true)} onOpenCommand={() => setCommandOpen(true)} />
        <ApiBanner />
        <main className="scrollbar-thin relative z-[1] flex-1 overflow-auto">
          <motion.div
            key={pathname}
            className="mx-auto w-full max-w-[var(--page-max)] px-4 py-6 sm:px-6 md:px-8 md:py-9"
            initial={reduce ? false : { opacity: 0, y: 14 }}
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
