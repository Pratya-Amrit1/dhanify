import { getCurrentBudget } from "@/lib/data/budget/queries";
import { BudgetRadialChart } from "./BudgetRadialChart";

export default async function BudgetOverviewCard() {
  const budgetData = await getCurrentBudget();

  const budget = budgetData?.budget?.amount ?? 0;
  const totalExpenses = budgetData?.totalExpenses ?? 0;

  return <BudgetRadialChart totalBudget={budget} spent={totalExpenses} />;
}
