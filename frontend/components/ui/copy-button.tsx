"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { useToast } from "@/providers/toast-provider";

import { Button } from "./button";

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      push({ kind: "info", title: `${label} copied` });
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      push({ kind: "error", title: "Unable to copy to clipboard" });
    }
  }

  return (
    <Button type="button" size="sm" variant="ghost" onClick={() => void onCopy()}>
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
