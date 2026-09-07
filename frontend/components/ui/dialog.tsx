"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "./button";

export function Dialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  confirmVariant = "danger",
  onClose,
  onConfirm,
  busy,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  confirmVariant?: "primary" | "danger";
  onClose: () => void;
  onConfirm?: () => void;
  busy?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const node = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "Tab" && focusable && focusable.length > 0) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/25"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative w-full max-w-lg scale-100 rounded-[1.5rem] border border-border bg-card p-6 shadow-pop motion-safe:animate-rise"
      >
        <h2 id="dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          {onConfirm ? (
            <Button
              type="button"
              variant={confirmVariant}
              onClick={onConfirm}
              disabled={busy}
            >
              {busy ? "Working…" : confirmLabel ?? "Confirm"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
