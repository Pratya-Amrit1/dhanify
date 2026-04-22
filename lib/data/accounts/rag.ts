import { randomUUID } from "crypto";
import { Prisma, TransactionType, AccountType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/gemini";

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
});
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

export const ACCOUNT_SUMMARY_WINDOW_DAYS = 30;

interface GenerateAccountSummaryInput {
  userId: string;
  accountId: string;
  accountName: string;
  accountType: AccountType;
  accountBalance: Prisma.Decimal | number;
  transactions: Array<{
    amount: Prisma.Decimal | number;
    type: TransactionType;
    category: string;
    description: string | null;
    date: Date;
  }>;
  budgetAmount?: number | null;
}

interface GenerateMonthlyAccountSummaryInput extends GenerateAccountSummaryInput {
  summaryMonth: Date;
}

type NormalizedTransaction = {
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: Date;
};

export async function upsertAccountTransactionSummaryRag(
  input: GenerateAccountSummaryInput,
) {
  const normalized = input.transactions.map((tx) => ({
    amount: typeof tx.amount === "number" ? tx.amount : Number(tx.amount),
    type: tx.type,
    category: tx.category,
    description: tx.description,
    date: new Date(tx.date),
  }));

  const budgetAmount = await resolveBudgetAmount(
    input.userId,
    input.budgetAmount,
  );
  const accountBalance =
    typeof input.accountBalance === "number"
      ? input.accountBalance
      : Number(input.accountBalance);

  const summary = buildAccountSummary(
    input.accountName,
    normalized,
    budgetAmount,
    input.accountType,
    accountBalance,
  );

  if (!summary) {
    return null;
  }

  const embedding = await generateEmbedding(summary);
  const vectorLiteral = `[${embedding.join(",")}]`;

  await prisma.$queryRaw`
    INSERT INTO account_transaction_rag (id, "userId", "accountId", content, embedding)
    VALUES (${randomUUID()}, ${input.userId}, ${input.accountId}, ${summary}, ${vectorLiteral}::vector(768))
    ON CONFLICT ("userId", "accountId")
    DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding;
  `;

  return summary;
}

export async function upsertAccountMonthlyTransactionSummaryRag(
  input: GenerateMonthlyAccountSummaryInput,
) {
  const normalized = input.transactions.map((tx) => ({
    amount: typeof tx.amount === "number" ? tx.amount : Number(tx.amount),
    type: tx.type,
    category: tx.category,
    description: tx.description,
    date: new Date(tx.date),
  }));

  const summaryMonthStart = getMonthStart(input.summaryMonth);
  const budgetAmount = await resolveBudgetAmount(
    input.userId,
    input.budgetAmount,
  );
  const accountBalance =
    typeof input.accountBalance === "number"
      ? input.accountBalance
      : Number(input.accountBalance);

  const summary = buildMonthlyAccountSummary(
    input.accountName,
    normalized,
    budgetAmount,
    summaryMonthStart,
    input.accountType,
    accountBalance,
  );

  const embedding = await generateEmbedding(summary);
  const vectorLiteral = `[${embedding.join(",")}]`;

  await prisma.$queryRaw`
    INSERT INTO account_monthly_transaction_rag (id, "userId", "accountId", "summaryMonth", content, embedding)
    VALUES (${randomUUID()}, ${input.userId}, ${input.accountId}, ${summaryMonthStart}, ${summary}, ${vectorLiteral}::vector(768))
    ON CONFLICT ("userId", "accountId", "summaryMonth")
    DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding;
  `;

  return summary;
}

function buildAccountSummary(
  accountName: string,
  transactions: NormalizedTransaction[],
  budgetAmount: number | null,
  accountType: AccountType,
  accountBalance: number,
) {
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - ACCOUNT_SUMMARY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );

  const windowed = transactions.filter((tx) => tx.date >= windowStart);

  return renderSummary({
    transactions: windowed,
    header: `Account ${accountName} summary (${DATE_FORMATTER.format(windowStart)} – ${DATE_FORMATTER.format(now)}).`,
    activityLine: `${windowed.length} transactions analyzed in the last ${ACCOUNT_SUMMARY_WINDOW_DAYS} days.`,
    budgetAmount,
    emptyMessage: `Account ${accountName} has no transactions in the last ${ACCOUNT_SUMMARY_WINDOW_DAYS} days.`,
    accountType,
    accountBalance,
  });
}

function buildMonthlyAccountSummary(
  accountName: string,
  transactions: NormalizedTransaction[],
  budgetAmount: number | null,
  summaryMonthStart: Date,
  accountType: AccountType,
  accountBalance: number,
) {
  const nextMonthStart = new Date(
    summaryMonthStart.getFullYear(),
    summaryMonthStart.getMonth() + 1,
    1,
  );

  const monthlyTransactions = transactions.filter(
    (tx) => tx.date >= summaryMonthStart && tx.date < nextMonthStart,
  );

  const monthLabel = MONTH_FORMATTER.format(summaryMonthStart);

  return renderSummary({
    transactions: monthlyTransactions,
    header: `Account ${accountName} summary for ${monthLabel}.`,
    activityLine: `${monthlyTransactions.length} transactions recorded in ${monthLabel}.`,
    budgetAmount,
    emptyMessage: `Account ${accountName} has no transactions recorded for ${monthLabel}.`,
    accountType,
    accountBalance,
  });
}

function renderSummary(options: {
  transactions: NormalizedTransaction[];
  header: string;
  activityLine: string;
  budgetAmount: number | null;
  emptyMessage: string;
  accountType: AccountType;
  accountBalance: number;
}) {
  const {
    transactions,
    header,
    activityLine,
    budgetAmount,
    emptyMessage,
    accountType,
    accountBalance,
  } = options;

  if (transactions.length === 0) {
    return emptyMessage;
  }

  let totalIncome = 0;
  let totalExpense = 0;
  const expenseByCategory: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type === TransactionType.INCOME) {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
      expenseByCategory[tx.category] =
        (expenseByCategory[tx.category] ?? 0) + tx.amount;
    }
  }

  const netFlow = totalIncome - totalExpense;
  const savingsAmount = Math.max(netFlow, 0);
  const savingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null;
  const budgetUsagePercent =
    budgetAmount !== null && budgetAmount > 0
      ? (totalExpense / budgetAmount) * 100
      : null;

  const categoryLines = Object.entries(expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => `- ${entry[0]}: ${formatAmount(entry[1])}`);

  const formattedCategories =
    categoryLines.length > 0
      ? categoryLines.join("\n")
      : "- No expense categories during this window.";

  const totals = [
    `Total income: ${formatAmount(totalIncome)}`,
    `Total expense: ${formatAmount(totalExpense)}`,
    `Net cash flow: ${formatAmount(netFlow)}`,
    `Savings amount: ${formatAmount(savingsAmount)}`,
  ].join("\n");

  const accountMeta = [
    `Account type: ${formatAccountType(accountType)}`,
    `Account balance: ${formatAmount(accountBalance)}`,
  ].join("\n");

  const budgetLine =
    budgetUsagePercent !== null && budgetAmount !== null
      ? `Budget insight: ${formatAmount(totalExpense)} spent vs ${formatAmount(
          budgetAmount,
        )} target (${formatPercent(budgetUsagePercent)} used).`
      : "Budget insight: No budget configured for this account.";

  const savingsLine =
    savingsRate !== null
      ? savingsRate >= 0
        ? `Savings insight: You're saving ${formatPercent(savingsRate)} of income.`
        : `Savings insight: You're spending ${formatPercent(
            Math.abs(savingsRate),
          )} more than you earn — cash flow at risk.`
      : "Savings insight: Unable to compute savings without recorded income.";

  return [
    header,
    activityLine,
    totals,
    accountMeta,
    budgetLine,
    savingsLine,
    "Top spending categories:",
    formattedCategories,
  ].join("\n");
}

async function resolveBudgetAmount(
  userId: string,
  provided?: number | null,
): Promise<number | null> {
  if (provided !== undefined) {
    return provided;
  }

  const budget = await prisma.budget.findUnique({
    where: { userId },
    select: { amount: true },
  });

  return budget ? Number(budget.amount) : null;
}

function getMonthStart(anchor: Date) {
  return new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
}

function formatAmount(value: number) {
  return INR_FORMATTER.format(Math.round((value + Number.EPSILON) * 100) / 100);
}

function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`;
}

function formatAccountType(type: AccountType) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}
