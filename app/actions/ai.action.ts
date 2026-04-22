"use server";

import { bulkTransactionSchema } from "@/lib/schemas/transaction.schema";
import { revalidatePath } from "next/cache";
import { ErrorCode } from "@/lib/constants/error-codes";
import { mapDomainError } from "@/lib/utils/mapDomainError";
import { saveBulkTransactions } from "@/lib/data/transactions/mutations";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireFeature } from "@/lib/data/users/subscription";
import { FEATURES } from "@/lib/config/features";
import {
  guardAiReceiptScan,
  incrementAiReceiptUsage,
  incrementBulkAiReceiptUsage,
  upsertImportJob,
} from "@/lib/data/users/usages";
import { EXPENSE_CATEGORIES } from "@/lib/constants/categories";
import generateImportId from "@/lib/utils/generateImportId";
import { ImportJobStatus } from "@prisma/client";
import { requireUser } from "@/lib/data/users/auth";
import { normalizeAiImportError } from "@/lib/utils/normalizeAiErrors";

// ai scan reciept action
const receiptSchema = z.object({
  amount: z.number().positive(),
  date: z.string(),
  description: z.string(),
  merchantName: z.string(),
  category: z.string(),
});

type AiReceiptScanResult =
  | {
      success: true;
      data: {
        amount: number;
        date: Date;
        description: string;
        category: string;
        isReceiptScan: boolean;
        importId: string;
      };
      message: string;
      aiReceiptScan: number;
    }
  | { success: false; error: string };

export async function aiScanReceiptAction(
  file: File,
): Promise<AiReceiptScanResult> {
  let importId: string = "";
  let userId: string = "";

  try {
    const user = await requireUser();
    userId = user.id;

    // usage guard
    await guardAiReceiptScan(user.id);

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    if (!apiKey) {
      throw new Error("Gemini API key is not defined");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    importId = generateImportId(Buffer.from(buffer));

    const prompt = `
This image contains EXACTLY ONE receipt for ONE transaction.

STRICT RULES:
- If more than ONE transaction, table, or receipt is visible → return []

Extract ONLY if exactly one transaction exists:
- Total amount
- Date
- Description
- Merchant name
- Category (choose one: ${EXPENSE_CATEGORIES.join(", ")})

Return ONLY valid JSON.

Valid receipt:
{
  "amount": number,
  "date": "YYYY-MM-DD",
  "description": "string",
  "merchantName": "string",
  "category": "string"
}

Multiple transactions:
[]
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ]);

    // ✅ JSON only (no regex needed)
    const text = result.response.text();
    const parsed = JSON.parse(text);

    // 🚫 MULTIPLE RECEIPTS (explicit signal)
    if (Array.isArray(parsed) && parsed.length === 0) {
      throw new Error(ErrorCode.BULK_RECEIPT_NOT_ALLOWED);
    }

    // 🚫 Unreadable / failed extraction
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Object.keys(parsed).length === 0
    ) {
      throw new Error(ErrorCode.RECEIPT_UNREADABLE);
    }

    const validated = receiptSchema.parse({
      ...parsed,
      amount: Number(parsed.amount),
    });

    let description = validated.description;
    if (validated.merchantName) {
      description = `${validated.merchantName} - ${validated.description}`;
    }

    // increment usage (consume quota) and persist usageId with import job
    const usage = await incrementAiReceiptUsage(user.id);

    // save importId with status SCANNED and attach usageId
    await upsertImportJob({
      importJobId: importId,
      userId: user.id,
      usageId: usage.id,
      status: ImportJobStatus.SCANNED,
    });

    return {
      success: true,
      message: "Receipt scanned successfully",
      data: {
        amount: validated.amount,
        date: new Date(validated.date),
        description,
        category: validated.category,
        isReceiptScan: true,
        importId,
      },
      aiReceiptScan: usage.aiReceiptScans,
    };
  } catch (error) {
    const mapped = mapDomainError(error);

    const aiError = normalizeAiImportError(error);

    const errorMessage = mapped?.error ?? aiError;

    // create importId with status failed
    if (error && importId && userId) {
      await upsertImportJob({
        importJobId: importId,
        userId,
        status: ImportJobStatus.FAILED,
        errMsg: errorMessage ?? "unknown AI receipt scan error",
      });
    }

    return { success: false, error: errorMessage };
  }
}

type AiBulkReceiptScanResult =
  | {
      success: true;
      message: string;
      data: {
        transactions: {
          amount: number;
          date: Date;
          description: string;
          category: string;
        }[];
        importId: string;
        isReceiptScan: boolean;
      };
    }
  | {
      success: false;
      error: string;
    };

const bulkReceiptSchema = z.object({
  transactions: z
    .array(
      z.object({
        amount: z.number().positive(),
        date: z.string(),
        description: z.string(),
        category: z.enum(EXPENSE_CATEGORIES),
      }),
    )
    .min(1),
});

export async function aiBulkReceiptScan(
  file: File,
): Promise<AiBulkReceiptScanResult> {
  let importId: string = "";
  let userId: string = "";

  try {
    const user = await requireUser();
    userId = user.id;

    // check premium feature ai bulk receipt scan
    await requireFeature(FEATURES.AI_BULK_INSERT);

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    if (!apiKey) {
      throw new Error("Gemini API key is not defined");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    importId = generateImportId(Buffer.from(buffer));

    const prompt = `
This image may contain MULTIPLE receipts or transactions.

GOAL:
- Extract ALL visible transactions.
- Each transaction must be independent.

RULES:
- If NO valid transactions are detected → return []
- Do NOT merge transactions.
- Do NOT hallucinate missing values.

Return ONLY valid JSON.

{
  "transactions": [
    {
      "amount": number,
      "date": "YYYY-MM-DD",
      "description": "string",
      "category": "${EXPENSE_CATEGORIES.join(" | ")}"
    }
  ]
}
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64,
        },
      },
    ]);

    // ✅ JSON only
    const parsed = JSON.parse(result.response.text().trim());

    // 🚫 No transactions found
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.transactions) ||
      parsed.transactions.length === 0
    ) {
      throw new Error(ErrorCode.NO_TRANSACTIONS_FOR_BULK_SCAN);
    }

    // ✅ Validate structure
    const validated = bulkReceiptSchema.parse(parsed);

    const transactions = validated.transactions.map((tx) => ({
      amount: tx.amount,
      date: new Date(tx.date),
      description: tx.description,
      category: tx.category,
    }));

    // increment bulk ai receipt usage
    const usageId = await incrementBulkAiReceiptUsage(user.id);

    // create importId with status SCANNED
    await upsertImportJob({
      importJobId: importId,
      userId: user.id,
      status: ImportJobStatus.SCANNED,
      usageId: usageId,
    });

    return {
      success: true,
      message: `${transactions.length} transactions scanned successfully`,
      data: { transactions, importId, isReceiptScan: true },
    };
  } catch (error) {
    const mapped = mapDomainError(error);

    const aiError = normalizeAiImportError(error);

    const errorMessage = mapped?.error ?? aiError;

    // create importId with status failed
    if (error && importId && userId) {
      await upsertImportJob({
        importJobId: importId,
        userId,
        status: ImportJobStatus.FAILED,
        errMsg: errorMessage ?? "unknown AI bulk receipt scan error",
      });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

type bulkSaveResponse =
  | { success: true; message: string }
  | { success: false; error: string };

export async function saveBulkTransactionsAction(
  data: unknown,
  importId: string,
): Promise<bulkSaveResponse> {
  try {
    const user = await requireUser();

    // parse and validate data
    const parsed = bulkTransactionSchema.safeParse(data);

    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid transaction data",
      };
    }

    const transactions = parsed.data;

    // call dal layer to save
    const result = await saveBulkTransactions(user.id, transactions, importId);

    const inserted = result?.inserted ?? 0;
    const rejected = result?.rejected ?? 0;

    // revalidate paths
    revalidatePath("/transactions");
    revalidatePath("/dashboard");
    revalidatePath("/accounts/[id]", "page");

    return {
      success: true,
      message:
        rejected === 0
          ? `${inserted} transactions imported successfully`
          : `${inserted} imported, ${rejected} duplicates skipped`,
    };
  } catch (error) {
    const mapped = mapDomainError(error);
    if (mapped) {
      return { success: false, error: mapped.error };
    }

    return { success: false, error: "bulk transaction save failed" };
  }
}
