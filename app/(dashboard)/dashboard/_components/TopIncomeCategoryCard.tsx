import TopIncomeBarChart from "./TopIncomeBarChart";
import { categoriesType } from "../page";

export default async function TopIncomeCategoryCard({
  topIncomeCategories,
}: {
  topIncomeCategories: categoriesType["topIncomeCategories"];
}) {
  return <TopIncomeBarChart categories={topIncomeCategories} />;
}
