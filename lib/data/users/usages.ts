import { prisma } from "@/lib/prisma";
import { getUserPlanFromDB } from "./subscription";
import { ImportJobStatus, PlanType, Prisma } from "@prisma/client";
import { ErrorCode } from "@/lib/constants/error-codes";
import { requireUser } from "./auth";

// for server-side usage guard
export async function guardAiReceiptScan(userId: string) {
  const FREE_AI_RECEIPT_LIMIT = 3;
  const plan = await getUserPlanFromDB(userId);

  if (plan !== PlanType.FREE) return;

  const usage = await prisma.usage.findUnique({
    where: { userId },
  });

  if (usage && usage.aiReceiptScans >= FREE_AI_RECEIPT_LIMIT) {
    throw new Error(ErrorCode.AI_RECEIPT_LIMIT_REACHED);
  }
}

// for client-side usage display
export async function getAiReceiptUsageStatus() {
  const FREE_AI_RECEIPT_LIMIT = 3;

  const user = await requireUser();

  const plan = await getUserPlanFromDB(user.id);

  //  null = FREE user
  const isFreeUser = !plan || plan === PlanType.FREE;

  if (!isFreeUser) {
    // PRO user
    return {
      limit: Infinity,
      used: 0,
      remaining: Infinity,
      isLimited: false,
    };
  }

  const usage = await prisma.usage.findUnique({
    where: { userId: user.id },
    select: { aiReceiptScans: true },
  });

  const used = usage?.aiReceiptScans ?? 0;

  return {
    limit: FREE_AI_RECEIPT_LIMIT,
    used,
    remaining: Math.max(0, FREE_AI_RECEIPT_LIMIT - used),
    isLimited: used >= FREE_AI_RECEIPT_LIMIT,
  };
}

/**
 * Increment AI receipt scan usage for a user.
 * Works both inside a transaction (tx) or standalone.
 */
export async function incrementAiReceiptUsage(
  userId: string,
  tx?: Prisma.TransactionClient,
) {
  const now = new Date();
  const client = tx ?? prisma;

  const result = await client.usage.upsert({
    where: { userId },
    select: { id: true, aiReceiptScans: true },
    update: {
      aiReceiptScans: { increment: 1 },
    },
    create: {
      userId,
      aiReceiptScans: 1,
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
  });

  return result;
}

/**
 * Increment bulk AI receipt import usage for a user.
 * Works both inside a transaction (tx) or standalone.
 */
export async function incrementBulkAiReceiptUsage(
  userId: string,
  tx?: Prisma.TransactionClient,
) {
  const now = new Date();
  const client = tx ?? prisma;

  const result = await client.usage.upsert({
    where: { userId },
    select: { id: true },
    update: {
      aiBulkImports: { increment: 1 },
    },
    create: {
      userId,
      aiBulkImports: 1,
      periodStart: now,
      periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
  });

  return result.id;
}

type UpsertImportJobArgs = {
  importJobId: string;
  userId: string;
  status: ImportJobStatus;
  usageId?: string;
  accountId?: string;
  errMsg?: string;
  tx?: Prisma.TransactionClient;
};

export async function upsertImportJob({
  importJobId,
  userId,
  status,
  usageId,
  accountId,
  errMsg,
  tx,
}: UpsertImportJobArgs) {
  const client = tx ?? prisma;

  //  Check existing job (idempotency + terminal state)
  const existing = await client.importJob.findUnique({
    where: {
      id_userId: { id: importJobId, userId },
    },
  });

  //  Terminal protection — SAVED is final
  if (existing?.status === ImportJobStatus.SAVED) {
    return existing;
  }

  //  Upsert safely
  return client.importJob.upsert({
    where: {
      id_userId: { id: importJobId, userId },
    },
    update: {
      status,
      ...(usageId !== undefined && { usageId }),
      ...(accountId !== undefined && { accountId }),
      ...(errMsg !== undefined && { errorMsg: errMsg }),
    },
    create: {
      id: importJobId,
      userId,
      status,
      ...(usageId && { usageId }),
      ...(accountId && { accountId }),
      ...(errMsg && { errorMsg: errMsg }),
    },
  });
}
