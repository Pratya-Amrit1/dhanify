import { TopExpensePieChart } from "./TopExpensePieChart";
import { categoriesType } from "../page";

export default async function TopExpenseCategoryCard({
  topExpenseCategories,
}: {
  topExpenseCategories: categoriesType["topExpenseCategories"];
}) {
  return <TopExpensePieChart categories={topExpenseCategories} />;
}
