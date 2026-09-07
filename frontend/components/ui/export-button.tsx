"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { downloadExport, type ExportKind } from "@/lib/api/export";
import { useToast } from "@/providers/toast-provider";

import { Button } from "./button";

export function ExportButton({
  kind,
  label = "Export CSV",
}: {
  kind: ExportKind;
  label?: string;
}) {
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    try {
      await downloadExport(kind);
      push({ kind: "info", title: `${label} downloaded` });
    } catch (error) {
      push({
        kind: "error",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unable to export CSV",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void onExport()}>
      <Download className="h-3.5 w-3.5" />
      {busy ? "Exporting…" : label}
    </Button>
  );
}
