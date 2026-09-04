"use client";

import type { ReactNode } from "react";

import { PipelineProvider } from "./pipeline-provider";
import { PreferencesProvider } from "./preferences-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";
import { ToastProvider } from "./toast-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <PreferencesProvider>
          <ToastProvider>
            <PipelineProvider>{children}</PipelineProvider>
          </ToastProvider>
        </PreferencesProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
