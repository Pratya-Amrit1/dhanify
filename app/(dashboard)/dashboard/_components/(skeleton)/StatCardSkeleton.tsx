import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardSkeletonProps = {
  className?: string;
  showDescription?: boolean;
  showDetail?: boolean;
};

export function StatCardSkeleton({
  className,
  showDescription = true,
  showDetail = true,
}: StatCardSkeletonProps) {
  return (
    <Card className={className}>
      {/* Header */}
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 pb-2">
        <div className="space-y-1 flex-1 min-w-0">
          {/* Title */}
          <Skeleton className="h-5 w-full max-w-[160px] sm:max-w-[180px] md:max-w-[240px]" />

          {/* Description */}
          {showDescription && (
            <Skeleton className="h-4 w-full max-w-[220px] sm:max-w-[280px] md:max-w-[320px]" />
          )}
        </div>

        {/* Icon */}
        <div className="flex-none">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-2 min-w-0">
        {/* Value */}
        <Skeleton className="h-7 w-full max-w-[200px] sm:max-w-[240px] md:max-w-[320px]" />

        {/* Detail */}
        {showDetail && (
          <Skeleton className="h-4 w-full max-w-[260px] sm:max-w-[320px] md:max-w-[400px]" />
        )}
      </CardContent>
    </Card>
  );
}
