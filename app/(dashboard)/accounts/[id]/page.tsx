import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import TransactionTable from "@/components/web/TransactionTable";
import ChartTable from "../_components/ChartTable";
import { getAllTransactionsByAccountId } from "@/lib/data/accounts/queries";
import ExportButton from "@/components/web/export-button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { AccountAnalyticsSkeleton } from "../_components/AccountAnalyticsSkeleton";
import { ExportFormat } from "@/lib/data/exports/export.data";
import {
  exportAccountTransactionAction,
  ExportActionResult,
} from "@/app/actions/accounts.action";

interface AccountTransactionFromProps {
  params: Promise<{ id: string }>;
}

const AccountTransactionPage = async ({
  params,
}: AccountTransactionFromProps) => {
  const { id } = await params;

  const accountData = await getAllTransactionsByAccountId(id);
  if (!accountData) {
    notFound();
  }

  const { account, transactions } = accountData;

  // ✅ Server action wrapper (typed + serializable)
  async function handleExportAction(
    format: ExportFormat,
  ): Promise<ExportActionResult> {
    "use server";
    return exportAccountTransactionAction(id, format);
  }

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<AccountAnalyticsSkeleton />}>
        {/* ✅ Responsive grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          {/* ================= LEFT SIDE ================= */}
          <div className="flex flex-col gap-4">
            {/* Account Header */}
            <div className="rounded-2xl border bg-card/80 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_60%)] px-4 py-5 shadow-lg shadow-black/5 md:px-6">
              <div className="flex flex-row gap-6 lg:items-center justify-between">
                {/* Left: account info */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Building2 className="h-5 w-5" />
                        </span>

                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            Account
                          </p>
                          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                            {account.name}
                          </h1>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted/70 px-3 py-1 font-medium text-foreground/80">
                          {account.type === "CURRENT"
                            ? "Current account"
                            : "Savings account"}
                        </span>
                        {account.isDefault && (
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: balance */}
                <div className="flex flex-col gap-3 ">
                  <span className="text-muted-foreground/70">
                    Current balance
                  </span>

                  <span className="text-xl font-semibold leading-none text-foreground sm:text-2xl">
                    ₹ {Number(account.balance).toFixed(2)}
                  </span>

                  <div className="flex flex-wrap gap-2 text-xs font-medium sm:justify-end">
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-400">
                      {account.totalTransactions} transactions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="min-h-[280px] sm:min-h-[320px]">
              <ChartTable transactions={transactions} />
            </div>
          </div>

          {/* ================= RIGHT SIDE ================= */}
          <Card className="h-full">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-base font-semibold">
                    Transactions
                  </CardTitle>
                  <CardDescription>
                    Search, filter, and review all activity for this account.
                  </CardDescription>
                </div>

                <ExportButton action={handleExportAction} accountId={id} />
              </div>
            </CardHeader>

            {/* ✅ Horizontal scroll safety for mobile */}
            <CardContent className="pt-4 overflow-x-auto scroll-smooth">
              <TransactionTable transactions={transactions} />
            </CardContent>
          </Card>
        </div>
      </Suspense>
    </div>
  );
};

export default AccountTransactionPage;
