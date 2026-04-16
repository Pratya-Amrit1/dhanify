import "dotenv/config";
import { prisma } from "../lib/prisma";

async function check() {
  try {
    const users = await prisma.user.findMany({ take: 5 });
    console.log("Users:", JSON.stringify(users, null, 2));

    const accounts = await prisma.account.findMany({ take: 5 });
    console.log("Accounts:", JSON.stringify(accounts, null, 2));

    const txCount = await prisma.transaction.count();
    console.log("Transaction count:", txCount);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("Error:", e.message);
    } else {
      console.error("Unknown error:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

check();
