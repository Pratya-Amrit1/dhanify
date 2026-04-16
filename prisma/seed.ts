// prisma/seed.ts
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";
import { Prisma } from "@prisma/client";

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const ACCOUNT_ID = "54749085-1e0e-4b43-abee-f33833ab8854";
const USER_ID = "e3d5cf8b-cdfc-4603-8f21-a06ea39c8676";

type TransactionType = "INCOME" | "EXPENSE";

const CATEGORIES: Record<
  TransactionType,
  { name: string; range: [number, number] }[]
> = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

function getRandomAmount(min: number, max: number) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type: TransactionType) {
  const item =
    CATEGORIES[type][Math.floor(Math.random() * CATEGORIES[type].length)];
  return {
    category: item.name,
    amount: getRandomAmount(item.range[0], item.range[1]),
  };
}

async function seedTransactions() {
  const transactions: Prisma.TransactionCreateManyInput[] = [];
  let totalBalance = 0;

  for (let i = 90; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const count = Math.floor(Math.random() * 3) + 1;

    for (let j = 0; j < count; j++) {
      const type: TransactionType = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
      const { category, amount } = getRandomCategory(type);

      transactions.push({
        id: crypto.randomUUID(),
        type,
        amount,
        description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
        date,
        category,
        status: "COMPLETED",
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        createdAt: date,
        updatedAt: date,
      });

      totalBalance += type === "INCOME" ? amount : -amount;
    }
  }

  console.log("Transactions to insert:", transactions.length);

  // ✅ SAFE for Neon
  await prisma.transaction.deleteMany({
    where: { accountId: ACCOUNT_ID },
  });

  await prisma.transaction.createMany({
    data: transactions,
  });

  await prisma.account.update({
    where: { id: ACCOUNT_ID },
    data: { balance: totalBalance },
  });

  console.log("✅ Seeding completed");
}

seedTransactions()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
