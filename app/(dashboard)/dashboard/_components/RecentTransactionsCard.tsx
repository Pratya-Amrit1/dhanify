import { format } from "date-fns";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { categoryColors } from "@/lib/constants/categories";
import { cn } from "@/lib/cn";

export type RecentTransaction = {
  id: string;
  date: string;
  description: string | null;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
};

type RecentTransactionsCardProps = {
  accountId: string;
  recentTransactions: RecentTransaction[];
};

export function RecentTransactionsCard({
  accountId,
  recentTransactions,
}: RecentTransactionsCardProps) {
  return (
    <Card className="lg:col-span-2 h-full">
      <CardHeader className="flex flex-col sm:flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your most recent income and expenses at a glance
          </CardDescription>
        </div>
        <Link
          href={`/accounts/${accountId}`}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full sm:w-auto mt-3 sm:mt-0",
          )}
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-accent">
              <TableRow>
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-center">Description</TableHead>
                <TableHead className="text-center">Category</TableHead>
                <TableHead className="text-center">Amount</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {recentTransactions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentTransactions.map((tx) => (
                  <TableRow key={tx.id} className="h-12">
                    <TableCell className="text-center">
                      {format(new Date(tx.date), "PP")}
                    </TableCell>
                    <TableCell className="text-center">
                      {tx.description ? (
                        tx.description.length > 30 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-block max-w-[360px] truncate align-middle">
                                  {tx.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs break-words">
                                  {tx.description}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span>{tx.description}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        style={{
                          background: categoryColors[tx.category] ?? "#6b7280",
                        }}
                        className="rounded px-2 py-1 text-xs text-white capitalize"
                      >
                        {tx.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          tx.type === "EXPENSE"
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {tx.type === "EXPENSE" ? "-₹ " : "+₹ "}
                        {tx.amount.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
