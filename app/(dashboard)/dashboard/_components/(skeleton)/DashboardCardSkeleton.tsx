"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>

      <CardContent>
        <div className="mx-auto max-h-[260px] aspect-square flex flex-col items-center justify-center">
          {/* chart skeleton */}
          <Skeleton className=" w-full h-full" />
        </div>

        {/* Bottom text */}
        <Skeleton className="mt-4 h-4 w-1/3 mx-auto" />
      </CardContent>
    </Card>
  );
}
