import "server-only";

import { prisma } from "@/lib/prisma";
import { AccountType, Prisma } from "@prisma/client";
import { ErrorCode } from "../../constants/error-codes";

type CreateAccountServiceProps = {
  userId: string;
  name: string;
  type: AccountType;
  balance: Prisma.Decimal;
  isDefault: boolean;
};

type UpdateDefaultAccountServiceProps = {
  userId: string;
  accountId: string;
};

type DeleteAccountServiceProps = {
  userId: string;
  accountId: string;
};

// create a new account
export async function createAccount({
  userId,
  name,
  type,
  balance,
  isDefault,
}: CreateAccountServiceProps) {
  // Check balance validity
  if (balance.isNaN() || balance.lessThan(0)) {
    throw new Error(ErrorCode.INVALID_BALANCE);
  }

  const existingAccounts = await prisma.account.count({ where: { userId } });
  const shouldDefaultAccount = existingAccounts === 0 ? true : isDefault;

  if (shouldDefaultAccount) {
    await prisma.account.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await prisma.account.create({
    data: {
      name,
      type,
      balance,
      isDefault: shouldDefaultAccount,
      userId,
    },
  });

  return account;
}

// update default account
export async function updateDefaultAccount({
  userId,
  accountId,
}: UpdateDefaultAccountServiceProps) {
  await prisma.$transaction([
    prisma.account.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.account.update({
      where: {
        id: accountId,
        userId, // ownership check
      },
      data: { isDefault: true },
    }),
  ]);
}

// delete an account
export async function deleteAccount({
  userId,
  accountId,
}: DeleteAccountServiceProps) {
  await prisma.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: accountId, userId },
    });
    if (!account) throw new Error(ErrorCode.ACCOUNT_NOT_FOUND);

    if (account.isDefault) {
      const anotherDefault = await tx.account.findFirst({
        where: { userId, id: { not: accountId }, isDefault: true },
      });
      if (!anotherDefault) throw new Error(ErrorCode.LAST_DEFAULT_ACCOUNT);
    }

    await tx.account.deleteMany({ where: { id: accountId, userId } });
  });
}
