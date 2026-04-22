import { tool } from "@langchain/core/tools";
import { Prisma } from "@prisma/client";
import { startOfMonth } from "date-fns";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/data/users/auth";
import { generateEmbedding } from "@/lib/gemini";

const MAX_TOP_K = 5;
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
});

const AccountMonthlyRagSearchSchema = z.object({
  query: z
    .string()
    .min(8, "Provide enough detail so I can search the knowledge base."),
  accountId: z.string().uuid().optional(),
  accountName: z.string().min(2).optional(),
  summaryMonth: z.string().optional(),
  topK: z.number().int().min(1).max(MAX_TOP_K).optional(),
});

type AccountMonthlyRagRow = {
  accountId: string;
  accountName: string;
  accountType: string;
  accountBalance: number | string;
  summaryMonth: Date | string;
  content: string;
  createdAt: Date | string;
  distance: number | string;
  similarity: number | string;
};

function toNumber(value: number | string) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toISOString();
}

export const accountMonthlyRagTool = tool(
  async (input: z.infer<typeof AccountMonthlyRagSearchSchema>) => {
    console.log("🛠️ account_monthely_RAG tool called");

    const user = await requireUser();
    const question = input.query.trim();

    if (!question) {
      throw new Error("Query cannot be empty");
    }

    const summaryMonth = input.summaryMonth
      ? startOfMonth(new Date(input.summaryMonth))
      : undefined;

    if (summaryMonth && Number.isNaN(summaryMonth.valueOf())) {
      throw new Error("summaryMonth must be a valid date string");
    }

    const embedding = await generateEmbedding(question);
    const vectorLiteral = `[${embedding.join(",")}]`;
    const limit = Math.min(input.topK ?? 3, MAX_TOP_K);

    const accountFilter = input.accountId
      ? Prisma.sql`AND amtr."accountId" = ${input.accountId}`
      : Prisma.sql``;

    const trimmedName = input.accountName?.trim();
    const accountNameFilter = trimmedName
      ? Prisma.sql`AND a.name ILIKE ${`%${trimmedName}%`}`
      : Prisma.sql``;

    const summaryMonthFilter = summaryMonth
      ? Prisma.sql`AND amtr."summaryMonth" = ${summaryMonth}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<AccountMonthlyRagRow[]>`
      WITH query_embedding AS (
        SELECT ${vectorLiteral}::vector(768) AS embedding
      )
      SELECT
        amtr."accountId",
        a.name AS "accountName",
        a.type AS "accountType",
        a.balance::float8 AS "accountBalance",
        amtr."summaryMonth",
        amtr.content,
        amtr."createdAt",
        (amtr.embedding <=> qe.embedding) AS distance,
        (1 - (amtr.embedding <=> qe.embedding)) AS similarity
      FROM account_monthly_transaction_rag amtr
      JOIN accounts a ON a.id = amtr."accountId"
      JOIN query_embedding qe ON true
      WHERE amtr."userId" = ${user.id}
      ${accountFilter}
      ${accountNameFilter}
      ${summaryMonthFilter}
      ORDER BY amtr.embedding <=> qe.embedding
      LIMIT ${limit};
    `;

    const results = rows.map((row) => {
      const summaryMonthIso = toIso(row.summaryMonth);
      return {
        accountId: row.accountId,
        accountName: row.accountName,
        accountType: row.accountType,
        accountBalance: toNumber(row.accountBalance),
        summaryMonth: summaryMonthIso,
        summaryMonthLabel: MONTH_FORMATTER.format(new Date(summaryMonthIso)),
        summary: row.content,
        createdAt: toIso(row.createdAt),
        distance: toNumber(row.distance),
        similarity: toNumber(row.similarity),
      };
    });

    return {
      tool: "account_monthly_rag",
      query: question,
      topK: limit,
      filters: {
        accountId: input.accountId ?? null,
        accountName: trimmedName ?? null,
        summaryMonth: summaryMonth?.toISOString() ?? null,
      },
      results,
      message:
        results.length === 0
          ? "No monthly account summaries were found for this query."
          : undefined,
    };
  },
  {
    name: "account_monthly_rag_lookup",
    description:
      "Answer natural-language questions about a specific month of account activity using semantic search over monthly summaries.",
    schema: AccountMonthlyRagSearchSchema,
  },
);
