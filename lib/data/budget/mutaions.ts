import "server-only";

//  create or update budget mutation
import { prisma } from "@/lib/prisma";

export async function createOrUpdateBudgetForUser(
  userId: string,
  amount: number,
): Promise<"created" | "updated"> {
  const existingBudget = await prisma.budget.findUnique({ where: { userId } });

  if (existingBudget) {
    await prisma.budget.update({ where: { userId }, data: { amount } });
    return "updated";
  } else {
    await prisma.budget.create({ data: { userId, amount } });
    return "created";
  }
}
