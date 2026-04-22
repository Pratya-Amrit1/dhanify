import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import {
  processRecurringTransaction,
  triggerRecurringTransactions,
} from "@/inngest/functions/transaction";
import { storeUserMemory } from "@/inngest/functions/memory";
import { refreshAccountTransactionRag } from "@/inngest/functions/refreshAccountTransactionRag";
import { refreshAccountMonthlySummaryFromEvent } from "@/inngest/functions/transactionMonthlySummary";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    triggerRecurringTransactions,
    processRecurringTransaction,
    storeUserMemory,
    refreshAccountTransactionRag,
    refreshAccountMonthlySummaryFromEvent,
  ],
});
