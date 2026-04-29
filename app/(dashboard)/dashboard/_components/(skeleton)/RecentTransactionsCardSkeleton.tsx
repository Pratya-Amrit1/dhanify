import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type RecentTransactionsCardSkeletonProps = {
  rows?: number;
};

export function RecentTransactionsCardSkeleton({
  rows = 5,
}: RecentTransactionsCardSkeletonProps) {
  return (
    <Card className="h-full">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>

        <Skeleton className="h-9 w-24 rounded-md" />
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-3">
        <div className="rounded-md border">
          {/* Table header */}
          <div className="grid grid-cols-4 bg-accent px-4 py-3">
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>

          {/* Table rows */}
          <div className="divide-y">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 items-center px-4 py-3">
                <Skeleton className="h-4 w-20 mx-auto" />
                <Skeleton className="h-4 w-40 mx-auto" />
                <Skeleton className="h-5 w-20 rounded-sm mx-auto" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
