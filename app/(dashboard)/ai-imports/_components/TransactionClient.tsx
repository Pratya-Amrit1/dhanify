"use client";

import { useMemo, useState, useCallback } from "react";
import { nanoid } from "nanoid";
import { TransactionType, Account, AccountType } from "@prisma/client";
import AiBulkReceiptScanner from "./AiBulkRecieptScan";
import BulkScanTransactionTable from "./BulkScanTransactionTable";
import { defaultCategories } from "@/lib/constants/categories";
import { EditableTransaction } from "@/lib/schemas/transaction.schema";

type ScannedReceipt = {
  amount: number;
  date: Date;
  description?: string;
  category?: string;
};

export type SimpleAccount = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  isDefault: boolean;
};

export default function TransactionsClient({
  accounts,
}: {
  accounts: Account[];
}) {
  // bulk scanned rows
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);

  // local added accounts (from drawer)
  const [localAccounts, setLocalAccounts] = useState<SimpleAccount[]>([]);
  const [importJobId, setImportJobId] = useState<string>("");

  // convert prisma → simple
  const baseAccounts = useMemo<SimpleAccount[]>(
    () =>
      accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance ?? 0),
        isDefault: a.isDefault,
      })),
    [accounts],
  );

  // merge DB + newly created
  const accountsState = useMemo<SimpleAccount[]>(() => {
    const map = new Map<string, SimpleAccount>();
    baseAccounts.forEach((a) => map.set(a.id, a));
    localAccounts.forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  }, [baseAccounts, localAccounts]);

  // ✅ stable setter for child (fixes useEffect warning + loops)
  const handleTransactionsChange = useCallback(
    (updater: React.SetStateAction<EditableTransaction[]>) => {
      setTransactions(updater);
    },
    [],
  );

  const handleBulkScanComplete = useCallback(
    (data: ScannedReceipt[], newImportJobId: string) => {
      const defaultAccountId = accountsState.find((a) => a.isDefault)?.id ?? "";

      const mapped: EditableTransaction[] = data.map((receipt) => ({
        id: nanoid(),
        selected: false,
        date: receipt.date,
        type: TransactionType.EXPENSE,
        amount: receipt.amount,
        accountId: defaultAccountId,
        description: receipt.description ?? "",
        category: receipt.category
          ? (defaultCategories.find(
              (c) => c.name.toLowerCase() === receipt.category!.toLowerCase(),
            )?.id ?? "")
          : "",
        recurring: "NONE",
      }));

      setTransactions(mapped);
      setImportJobId(newImportJobId);
    },
    [accountsState],
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <AiBulkReceiptScanner onScanComplete={handleBulkScanComplete} />

      <BulkScanTransactionTable
        data={transactions}
        onChangeAction={handleTransactionsChange}
        accounts={accountsState}
        onAccountCreatedAction={setLocalAccounts}
        importJobId={importJobId}
      />
    </div>
  );
}
