"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

import { startPipelineRun } from "@/lib/api/runs";
import type { RunResult } from "@/lib/api/types";
import { queryKeys } from "@/lib/utils/query-keys";
import { useToast } from "@/providers/toast-provider";

type PipelineContextValue = {
  run: () => void;
  isPending: boolean;
  lastResult: RunResult | undefined;
};

const PipelineContext = createContext<PipelineContextValue | null>(null);

export function PipelineProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const { push } = useToast();
  const mutation = useMutation({
    mutationFn: startPipelineRun,
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.status }),
        client.invalidateQueries({ queryKey: queryKeys.health }),
        client.invalidateQueries({ queryKey: queryKeys.runs }),
        client.invalidateQueries({ queryKey: queryKeys.files }),
        client.invalidateQueries({ queryKey: queryKeys.metrics }),
        client.invalidateQueries({ queryKey: queryKeys.quarantine }),
        client.invalidateQueries({ queryKey: queryKeys.system }),
        client.invalidateQueries({ queryKey: ["events"] }),
      ]);
      if (result.status === "completed") {
        push({
          kind: "success",
          title: "Pipeline completed",
          description: `Accepted ${result.records_accepted}, quarantined ${result.records_quarantined}.`,
        });
      } else {
        push({
          kind: "error",
          title: "Pipeline failed",
          description: result.error || "The run finished with an error.",
        });
      }
    },
    onError: (error: Error) => {
      push({
        kind: "error",
        title: "Pipeline request failed",
        description: error.message,
      });
    },
  });

  return (
    <PipelineContext.Provider
      value={{
        run: () => {
          if (!mutation.isPending) {
            mutation.mutate();
          }
        },
        isPending: mutation.isPending,
        lastResult: mutation.data,
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipelineActions(): PipelineContextValue {
  const value = useContext(PipelineContext);
  if (!value) {
    throw new Error("usePipelineActions must be used within PipelineProvider");
  }
  return value;
}
