"use client";

import { ErrorState } from "@/components/feedback/error-state";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="This view failed to render"
      message="The control center recovered from an unexpected error. Retry this page without leaving the app."
      onRetry={reset}
    />
  );
}
