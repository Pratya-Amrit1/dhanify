import getDefaultAccountDataForDashboard, {
  CategorySummary,
  getTopCategoriesForDashboard,
} from "@/lib/data/dashboard/queries";
import DashboardClient from "./_components/DashboardClient";
import { KpiTimeRange } from "@/lib/utils/timerange";

export type categoriesType = {
  topExpenseCategories: CategorySummary[];
  topIncomeCategories: CategorySummary[];
};

export default async function DashboardPage() {
  const data = await getDefaultAccountDataForDashboard(KpiTimeRange.THIS_MONTH);
  const { topExpenseCategories, topIncomeCategories } =
    await getTopCategoriesForDashboard(KpiTimeRange.THIS_MONTH);

  const categories: categoriesType = {
    topExpenseCategories,
    topIncomeCategories,
  };

  return <DashboardClient data={data} categories={categories} />;
}
