import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TransactionTable from "@/components/web/TransactionTable";
import { getRecurringTransactions } from "@/lib/data/transactions/queries";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

export default async function RecurringTransactionsPage() {
  const recurringTransactions = await getRecurringTransactions();

  return (
    <div>
      <Card className="h-full">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">
                Recurring Transactions
              </CardTitle>
              <CardDescription>
                Manage all your recurring transactions here.
              </CardDescription>
            </div>
            <Link
              href="/transactions/create?recurring=true&returnUrl=/recurrings"
              className={cn(
                buttonVariants({ variant: "default" }),
                "ml-auto flex items-center gap-2 w-full sm:w-auto",
              )}
            >
              <Plus className="h-4 w-4" />
              Add Recurring Transaction
            </Link>
          </div>
        </CardHeader>

        {/* ✅ Horizontal scroll safety for mobile */}
        <CardContent className="pt-4 overflow-x-auto">
          <TransactionTable
            transactions={recurringTransactions}
            showAccountColumn
            showRecurringMetaColumns
          />
        </CardContent>
      </Card>
    </div>
  );
}
