"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { startPipelineRun } from "@/lib/api/runs";
import { queryKeys } from "@/lib/utils/query-keys";
import { useToast } from "@/providers/toast-provider";

export function usePipelineMutation() {
  const client = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: startPipelineRun,
    onSuccess: async (result) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: queryKeys.status }),
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
}
