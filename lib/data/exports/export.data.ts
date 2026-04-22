import { Transaction } from "@prisma/client";
import { exportToCSV } from "./export.csv";
import { exportToExcel } from "./export.excel";
import { exportToPDF } from "./export.pdf";

export type ExportFormat = "csv" | "excel" | "pdf";

export type Transactions = Pick<
  Transaction,
  | "date"
  | "description"
  | "amount"
  | "category"
  | "type"
  | "accountId"
  | "recurringInterval"
  | "createdAt"
>[];

export async function exportTransactions(
  format: ExportFormat,
  data: Transactions,
  accountId?: string,
) {
  switch (format) {
    case "csv":
      return await exportToCSV(data, accountId);
    case "excel":
      return await exportToExcel(data, accountId);
    case "pdf":
      return await exportToPDF(data, accountId);
    default:
      throw new Error("Unsupported export format");
  }
}
