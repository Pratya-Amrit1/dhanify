import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import TransactionTable from "@/components/web/TransactionTable";
import { getAllTransactions } from "@/lib/data/transactions/queries";

export default async function TransactionsPage() {
  const allTransactions = await getAllTransactions();

  return (
    <div className="w-full">
      <Card className="h-full w-full max-w-full overflow-hidden">
        <CardHeader className="border-b px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                All Transactions
              </CardTitle>
              <CardDescription>
                Manage all your transactions across accounts here.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-6 pt-0 sm:px-6">
          <div className="w-full overflow-x-auto">
            <TransactionTable
              transactions={allTransactions}
              showAccountColumn
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
