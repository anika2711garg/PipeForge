"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Beaker } from "lucide-react";
import { useState } from "react";

import { generateDemoBatch, resetDemoData } from "@/lib/api/demo";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { queryKeys } from "@/lib/utils/query-keys";
import { useToast } from "@/providers/toast-provider";

export function DemoTools() {
  const client = useQueryClient();
  const { push } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function invalidateAll() {
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.status }),
      client.invalidateQueries({ queryKey: queryKeys.runs }),
      client.invalidateQueries({ queryKey: queryKeys.files }),
      client.invalidateQueries({ queryKey: queryKeys.metrics }),
      client.invalidateQueries({ queryKey: queryKeys.quarantine }),
      client.invalidateQueries({ queryKey: queryKeys.system }),
      client.invalidateQueries({ queryKey: ["events"] }),
    ]);
  }

  const generate = useMutation({
    mutationFn: generateDemoBatch,
    onSuccess: async (result) => {
      await invalidateAll();
      push({
        kind: "success",
        title: "Demo batch generated",
        description: `Wrote ${result.files.length} JSONL files.`,
      });
    },
    onError: (error: Error) => {
      push({ kind: "error", title: "Demo generation failed", description: error.message });
    },
  });

  const reset = useMutation({
    mutationFn: resetDemoData,
    onSuccess: async () => {
      await invalidateAll();
      setConfirmOpen(false);
      push({ kind: "success", title: "Demo data reset" });
    },
    onError: (error: Error) => {
      push({ kind: "error", title: "Reset failed", description: error.message });
    },
  });

  const busy = generate.isPending || reset.isPending;

  return (
    <section className="glass rounded-3xl border border-border p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-primary/15 p-2 text-primary">
            <Beaker className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Sandbox</p>
            <h2 className="mt-1 text-lg font-medium">Demo dataset</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Synthetic demonstration tools only. These actions are not part of production ingestion.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => generate.mutate()}>
            {generate.isPending ? "Generating…" : "Generate Demo Batch"}
          </Button>
          <Button type="button" variant="danger" disabled={busy} onClick={() => setConfirmOpen(true)}>
            Reset Demo Data
          </Button>
        </div>
      </div>
      <Dialog
        open={confirmOpen}
        title="Reset demo data?"
        description="This deletes the local warehouse database and incoming JSONL files, then writes a fresh synthetic demo batch. Existing ingested events, runs, metrics, and quarantine records will be removed."
        confirmLabel="Reset demo data"
        busy={reset.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => reset.mutate()}
      />
    </section>
  );
}
