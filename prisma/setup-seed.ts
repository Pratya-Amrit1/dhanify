import "dotenv/config";
import { prisma } from "../lib/prisma";

const ACCOUNT_ID = "54749085-1e0e-4b43-abee-f33833ab8854";
const USER_ID = "e3d5cf8b-cdfc-4603-8f21-a06ea39c8676";

async function setupSeedData() {
  try {
    // Create the user if it doesn't exist
    const user = await prisma.user.upsert({
      where: { id: USER_ID },
      update: {},
      create: {
        id: USER_ID,
        clerkUserId: "seed_user_clerk_id",
        email: "seed@dhanify.dev",
        firstName: "Seed",
        lastName: "User",
      },
    });
    console.log("✅ User ready:", user.id);

    // Create the account if it doesn't exist
    const account = await prisma.account.upsert({
      where: { id: ACCOUNT_ID },
      update: {},
      create: {
        id: ACCOUNT_ID,
        name: "Seed Account",
        type: "SAVING",
        balance: 0,
        isDefault: true,
        userId: USER_ID,
      },
    });
    console.log("✅ Account ready:", account.id);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error("❌ Setup failed:", e.message);
    } else {
      console.error("❌ Unknown error:", e);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupSeedData();
