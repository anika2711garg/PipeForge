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
    <div className="surface rounded-2xl px-6 py-12 sm:px-10 sm:py-14">
      <p className="kicker text-destructive">Error</p>
      <h3 className="display mt-3 max-w-xl text-[1.45rem] sm:text-[1.6rem]">{title}</h3>
      <p className="mt-2.5 max-w-lg text-sm leading-6 text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button className="mt-6" type="button" variant="primary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
