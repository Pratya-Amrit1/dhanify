import { TransactionType } from "@prisma/client";
import { Transactions } from "./export.data";

export async function exportToCSV(
  transactions: Transactions,
  accountId?: string,
) {
  // Build a simple CSV string so the result is serializable for server actions
  const headers = ["Date", "Description", "Amount", "Category", "Type"];

  const rows = transactions.map((tx) => {
    const date =
      tx.date instanceof Date
        ? tx.date.toISOString().split("T")[0]
        : String(tx.date);

    const description = String(tx.description ?? "");
    const amount = String(tx.amount ?? "");
    const category = String(tx.category ?? "");
    const type = String(tx.type ?? "") as TransactionType;

    // Escape double quotes by doubling them and wrap fields that contain commas or quotes
    const escape = (v: string) => {
      if (v.includes('"')) v = v.replace(/"/g, '""');
      if (v.includes(",") || v.includes('"') || v.includes("\n"))
        return `"${v}"`;
      return v;
    };

    return [date, description, amount, category, type].map(escape).join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");

  return {
    data: csvContent,
    mime: "text/csv",
    filename: accountId ? `transactions_${accountId}.csv` : "transactions.csv",
  };
}
