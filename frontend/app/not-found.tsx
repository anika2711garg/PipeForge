import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">404</p>
      <h1 className="display mt-3 text-[2.25rem]">Missing</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
        That route is not part of the PipeForge control center.
      </p>
      <Link href="/" className="mt-8 inline-block">
        <Button type="button" variant="primary">
          Back to overview
        </Button>
      </Link>
    </div>
  );
}
