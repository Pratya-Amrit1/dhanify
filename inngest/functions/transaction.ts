import { prisma } from "@/lib/prisma";
import { inngest } from "../client";
import { calculateNextRecurringDate } from "@/lib/utils/recurring";

export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  {
    cron: "0 0 * * *", // every day at midnight
  },
  async ({ step }) => {
    // Step 1: Fetch all transactions due for recurrence today
    const dueRecurringTransactions = await step.run(
      "fetch-due-recurring-transactions",
      async () => {
        return prisma.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            nextRecurringDate: {
              lte: new Date(), // <-- due today or earlier
            },
          },
          select: {
            id: true,
            userId: true,
          },
        });
      },
    );

    // Step 2: For each due transaction, trigger the recurrence process
    if (dueRecurringTransactions.length > 0) {
      await inngest.send(
        dueRecurringTransactions.map((tx) => ({
          name: "transaction.recurring.process",
          data: {
            transactionId: tx.id,
            userId: tx.userId,
          },
        })),
      );
    }
  },
);

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // max 10 executions
      period: "1m", // per minute,
      key: "event.data.userId", // per user
    },
  },
  {
    event: "transaction.recurring.process",
  },
  async ({ event, step }) => {
    const { transactionId, userId } = event.data;
    if (!transactionId || !userId) {
      console.error("Invalid event data for recurring transaction", event);
      return;
    }

    await step.run("process-due-recurring-transaction", async () => {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          isRecurring: true,
          status: "COMPLETED",
        },
        include: {
          account: true,
        },
      });

      if (!transaction) {
        console.error(
          `Transaction not found or not eligible for recurrence: ${transactionId}`,
        );
        return;
      }

      // create the recurring transaction
      await prisma.$transaction(async (tx) => {
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description ?? ""} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // update account balance
        const balanceChange =
          transaction.type === "INCOME"
            ? transaction.amount
            : transaction.amount.neg();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: {
            balance: { increment: balanceChange },
          },
        });

        // update nextRecurringDate
        if (transaction.recurringInterval) {
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              lastProcessed: new Date(),
              nextRecurringDate: calculateNextRecurringDate(
                transaction.nextRecurringDate ?? new Date(),
                transaction.recurringInterval,
              ),
            },
          });
        }
      });
    });
  },
);
