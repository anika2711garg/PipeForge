import { Button } from "@/components/ui/button";

export function ErrorState({
  title = "Unable to load this view",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="glass rounded-3xl border border-destructive/25 px-6 py-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-destructive">Error</p>
      <h3 className="display mt-3 text-4xl">{title}</h3>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-6" type="button" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
