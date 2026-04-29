import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

export type StatCardProps = {
  title: string;
  value: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconClassName?: string;
  valueClassName?: string;
  className?: string;
  description?: React.ReactNode;
  detail?: React.ReactNode;
};

export function StatCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  valueClassName,
  className,
  description,
  detail,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <div className="mt-1">
              <CardDescription>{description}</CardDescription>
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>

      <CardContent>
        <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
        {detail ? (
          <div className="mt-2 text-sm text-muted-foreground">{detail}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
