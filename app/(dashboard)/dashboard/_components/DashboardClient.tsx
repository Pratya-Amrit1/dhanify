import { Wallet2, TrendingDown, TrendingUp } from "lucide-react";

import BudgetOverviewCard from "./BudgetOverviewCard";
import { EmptyDashboard } from "./EmptyDashboard";
import { RecentTransactionsCard } from "./RecentTransactionsCard";
import { StatCard } from "./StatCard";
import TopIncomeCategoryCard from "./TopIncomeCategoryCard";
import TopExpenseCategoryCard from "./TopExpenseCategoryCard";
import { Suspense } from "react";
import { DashboardCardSkeleton } from "./(skeleton)/DashboardCardSkeleton";
import { RecentTransactionsCardSkeleton } from "./(skeleton)/RecentTransactionsCardSkeleton";
import { StatCardSkeleton } from "./(skeleton)/StatCardSkeleton";
import { categoriesType } from "../page";

type RecentTransaction = {
  id: string;
  date: string;
  description: string | null;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
};

type DashboardData = {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  totalIncome: number;
  totalExpense: number;
  recentTransactions: RecentTransaction[];
} | null;

export default function DashboardClient({
  data,
  categories,
}: {
  data: DashboardData;
  categories: categoriesType;
}) {
  if (!data) {
    return <EmptyDashboard />;
  }

  const {
    balance,
    totalIncome,
    totalExpense,
    recentTransactions,
    accountId,
    accountName,
    accountType,
  } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* ================= TOP ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-12 gap-6 2xl:gap-8 items-stretch">
        {/* LEFT 70% */}
        <div className="lg:col-span-8 2xl:col-span-8 grid grid-cols-1 lg:grid-cols-8 gap-7 items-stretch">
          {/* Account details – 35% */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col space-y-6 h-full">
            <Suspense fallback={<StatCardSkeleton />}>
              <StatCard
                title="Total Balance"
                description="Your default account for daily transactions"
                value={`₹ ${balance.toFixed(2)}`}
                icon={Wallet2}
                iconClassName="bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                className="flex-1"
                detail={
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {accountName}
                    </span>

                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Default
                    </span>

                    <span className="text-xs">
                      • {accountType.toLowerCase()}
                    </span>
                  </div>
                }
              />
            </Suspense>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
              <Suspense fallback={<StatCardSkeleton />}>
                <StatCard
                  title="Total Expense"
                  description="Spent this month"
                  value={`₹ ${totalExpense.toFixed(2)}`}
                  icon={TrendingDown}
                  iconClassName="bg-red-50 text-red-600 dark:bg-red-950/40"
                  valueClassName="text-red-600 dark:text-red-400"
                />
              </Suspense>

              <Suspense fallback={<StatCardSkeleton />}>
                <StatCard
                  title="Total Income"
                  description="Received this month"
                  value={`₹ ${totalIncome.toFixed(2)}`}
                  icon={TrendingUp}
                  iconClassName="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                  valueClassName="text-emerald-600 dark:text-emerald-400"
                />
              </Suspense>
            </div>
          </div>

          {/* Budget progress – 35% */}
          <div className="lg:col-span-4 xl:col-span-4 h-full">
            <Suspense fallback={<DashboardCardSkeleton />}>
              <BudgetOverviewCard />
            </Suspense>
          </div>
        </div>

        {/* RIGHT 30% – Income categories */}
        <div className="lg:col-span-4 2xl:col-span-4 h-full">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <TopIncomeCategoryCard
              topIncomeCategories={categories.topIncomeCategories}
            />
          </Suspense>
        </div>
      </div>

      {/* ================= BOTTOM ROW ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-12 gap-6 2xl:gap-8">
        {/* Recent transactions – 70% */}
        <div className="lg:col-span-8 2xl:col-span-8 h-full">
          <Suspense fallback={<RecentTransactionsCardSkeleton />}>
            <RecentTransactionsCard
              accountId={accountId}
              recentTransactions={recentTransactions}
            />
          </Suspense>
        </div>

        {/* Expense categories – 30% */}
        <div className="lg:col-span-4 2xl:col-span-4 h-full">
          <Suspense fallback={<DashboardCardSkeleton />}>
            <TopExpenseCategoryCard
              topExpenseCategories={categories.topExpenseCategories}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
