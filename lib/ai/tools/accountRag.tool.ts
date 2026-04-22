import { tool } from "@langchain/core/tools";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/data/users/auth";
import { generateEmbedding } from "@/lib/gemini";

const MAX_TOP_K = 5;

const AccountRagSearchSchema = z.object({
  query: z
    .string()
    .min(8, "Provide enough detail so I can search the knowledge base."),
  accountId: z.string().uuid().optional(),
  accountName: z.string().min(2).optional(),
  topK: z.number().int().min(1).max(MAX_TOP_K).optional(),
});

type AccountRagRow = {
  accountId: string;
  accountName: string;
  accountType: string;
  accountBalance: number | string;
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

export const accountRagTool = tool(
  async (input: z.infer<typeof AccountRagSearchSchema>) => {
    console.log("🛠️ account_RAG tool called");

    const user = await requireUser();
    const question = input.query.trim();

    if (!question) {
      throw new Error("Query cannot be empty");
    }

    const embedding = await generateEmbedding(question);
    const vectorLiteral = `[${embedding.join(",")}]`;
    const limit = Math.min(input.topK ?? 3, MAX_TOP_K);

    const accountFilter = input.accountId
      ? Prisma.sql`AND atr."accountId" = ${input.accountId}`
      : Prisma.sql``;

    const trimmedName = input.accountName?.trim();
    const accountNameFilter = trimmedName
      ? Prisma.sql`AND a.name ILIKE ${`%${trimmedName}%`}`
      : Prisma.sql``;

    const rows = await prisma.$queryRaw<AccountRagRow[]>`
      WITH query_embedding AS (
        SELECT ${vectorLiteral}::vector(768) AS embedding
      )
      SELECT
        atr."accountId",
        a.name AS "accountName",
        a.type AS "accountType",
        a.balance::float8 AS "accountBalance",
        atr.content,
        atr."createdAt",
        (atr.embedding <=> qe.embedding) AS distance,
        (1 - (atr.embedding <=> qe.embedding)) AS similarity
      FROM account_transaction_rag atr
      JOIN accounts a ON a.id = atr."accountId"
      JOIN query_embedding qe ON true
      WHERE atr."userId" = ${user.id}
      ${accountFilter}
      ${accountNameFilter}
      ORDER BY atr.embedding <=> qe.embedding
      LIMIT ${limit};
    `;

    const results = rows.map((row) => ({
      accountId: row.accountId,
      accountName: row.accountName,
      accountType: row.accountType,
      accountBalance: toNumber(row.accountBalance),
      summary: row.content,
      createdAt: toIso(row.createdAt),
      distance: toNumber(row.distance),
      similarity: toNumber(row.similarity),
    }));

    return {
      tool: "account_rag",
      query: question,
      topK: limit,
      filters: {
        accountId: input.accountId ?? null,
        accountName: trimmedName ?? null,
      },
      results,
      message:
        results.length === 0
          ? "No account-level summaries were found for this query."
          : undefined,
    };
  },
  {
    name: "account_rag_lookup",
    description:
      "Answer natural-language questions about a user's account activity using semantic search over recent summaries.",
    schema: AccountRagSearchSchema,
  },
);
