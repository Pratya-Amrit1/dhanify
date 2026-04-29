import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader as THeader,
  TableRow,
} from "@/components/ui/table";

export function AccountAnalyticsSkeleton() {
  return (
    <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
      {/* Left column: account header + chart card skeleton */}
      <div className="flex h-full flex-col gap-4">
        {/* Account header skeleton */}
        <div className="rounded-xl border bg-gradient-to-br from-background to-muted px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-5 w-28 rounded-full" />
                  <Skeleton className="h-5 w-28 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-5 w-32 rounded-full" />
            </div>
          </div>
        </div>

        {/* Chart card skeleton */}
        <div className="flex-1">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div>
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-64" />
              </div>
              <Skeleton className="h-9 w-[180px]" />
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pb-6">
              <div className="mb-6 flex justify-around text-sm">
                {[0, 1, 2].map((key) => (
                  <div key={key} className="text-center">
                    <Skeleton className="mx-auto mb-2 h-3 w-20" />
                    <Skeleton className="mx-auto h-5 w-24" />
                  </div>
                ))}
              </div>
              <div className="h-[320px] md:h-[360px]">
                <Skeleton className="h-full w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right column: transactions card skeleton */}
      <Card className="h-full">
        <CardHeader className="border-b">
          <Skeleton className="mb-2 h-4 w-36" />
          <Skeleton className="h-3 w-80" />
        </CardHeader>
        <CardContent className="pt-4">
          {/* Filters row skeleton (search + two selects) */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <Skeleton className="h-9 flex-1" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-9 w-[140px]" />
              <Skeleton className="h-9 w-[170px]" />
            </div>
          </div>

          {/* Table skeleton: reuse Shadcn Table so sizing matches TransactionTable */}
          <div className="rounded-md border">
            <Table>
              <THeader className="bg-accent">
                <TableRow>
                  <TableHead className="w-[50px] text-center">
                    <Skeleton className="mx-auto h-4 w-4 rounded-[4px]" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Skeleton className="mx-auto h-4 w-16" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Skeleton className="mx-auto h-4 w-24" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Skeleton className="mx-auto h-4 w-20" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Skeleton className="mx-auto h-4 w-20" />
                  </TableHead>
                  <TableHead className="text-center">
                    <Skeleton className="mx-auto h-4 w-20" />
                  </TableHead>
                  <TableHead className="w-[50px] text-center">
                    <Skeleton className="mx-auto h-4 w-4" />
                  </TableHead>
                </TableRow>
              </THeader>
              <TableBody>
                {Array.from({ length: 10 }).map((_, row) => (
                  <TableRow key={row} className="h-12">
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-4 rounded-[4px]" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Skeleton className="mx-auto h-4 w-4" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination/footer skeleton */}
          <div className="mt-2 flex items-center justify-between gap-2 py-2 text-sm text-muted-foreground">
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
