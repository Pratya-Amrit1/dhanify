import ExcelJS from "exceljs";
import { TransactionType, RecurringInterval } from "@prisma/client";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/constants/categories";
import { Transactions } from "./export.data";

export async function exportToExcel(
  transactions: Transactions,
  accountId?: string,
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dhanify";
  workbook.created = new Date();

  // ===============================
  // 1️⃣ Transactions Sheet
  // ===============================
  const sheet = workbook.addWorksheet("Transactions", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Description", key: "description", width: 32 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Category", key: "category", width: 22 },
    { header: "Type", key: "type", width: 14 },
    { header: "Recurring", key: "recurring", width: 18 },
  ];

  // ===============================
  // 2️⃣ Header Styling
  // ===============================
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  sheet.autoFilter = "A1:F1";

  // ===============================
  // 3️⃣ Meta Sheet (Dropdown Data)
  // ===============================
  const metaSheet = workbook.addWorksheet("_meta");
  metaSheet.state = "hidden";

  metaSheet.getColumn("A").values = ["", ...Object.values(TransactionType)];
  metaSheet.getColumn("B").values = ["", ...Object.values(RecurringInterval)];
  metaSheet.getColumn("C").values = ["", ...EXPENSE_CATEGORIES];
  metaSheet.getColumn("D").values = ["", ...INCOME_CATEGORIES];

  // ===============================
  // 4️⃣ Rows + Styling
  // ===============================
  transactions.forEach((tx) => {
    const excelDate = tx.date instanceof Date ? tx.date : new Date(tx.date);

    const row = sheet.addRow({
      date: excelDate,
      description: tx.description ?? "",
      amount: tx.amount,
      category: tx.category ?? "",
      type: tx.type,
      recurring: tx.recurringInterval ?? "",
    });

    // ---- Formats ----
    row.getCell("date").numFmt = "dd-mmm-yyyy";
    row.getCell("amount").numFmt = '"₹"#,##0.00';

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    row.getCell("description").alignment = {
      vertical: "middle",
      horizontal: "left",
    };

    // ===============================
    // 🎨 FULL ROW HIGHLIGHT
    // ===============================
    const fillColor = tx.type === "EXPENSE" ? "FFFEE2E2" : "FFDCFCE7"; // red / green

    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
    });

    // ===============================
    // 🔽 Dropdowns
    // ===============================
    // Type
    row.getCell("type").dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`=_meta!$A$2:$A$${Object.values(TransactionType).length + 1}`],
    };

    // Recurring
    row.getCell("recurring").dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [
        `=_meta!$B$2:$B$${Object.values(RecurringInterval).length + 1}`,
      ],
    };

    // Category (FILTERED BY TYPE)
    if (tx.type === "EXPENSE") {
      row.getCell("category").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=_meta!$C$2:$C$${EXPENSE_CATEGORIES.length + 1}`],
      };
    } else {
      row.getCell("category").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: [`=_meta!$D$2:$D$${INCOME_CATEGORIES.length + 1}`],
      };
    }
  });

  // ===============================
  // 5️⃣ Export
  // ===============================
  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  return {
    data: base64,
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    filename: accountId
      ? `dhanify_transactions_${accountId}.xlsx`
      : "dhanify_transactions.xlsx",
  };
}
