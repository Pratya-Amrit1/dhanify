import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-2">
          {/* Account name */}
          <Skeleton className="h-4 w-24" />
          {/* Sub label / meta */}
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Default switch placeholder */}
        <Skeleton className="h-5 w-10 rounded-full" />
      </CardHeader>

      <CardContent className="space-y-2">
        {/* Balance */}
        <Skeleton className="h-7 w-32" />

        {/* Account type */}
        <Skeleton className="h-3 w-20" />
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>
      </CardFooter>
    </Card>
  );
}
