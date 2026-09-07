import { Suspense } from "react";

import { ComparePage } from "@/components/dashboard/compare-page";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-48 w-full" />}>
      <ComparePage />
    </Suspense>
  );
}
