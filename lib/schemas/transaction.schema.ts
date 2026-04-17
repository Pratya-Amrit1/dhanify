import { RecurringInterval, TransactionType } from "@prisma/client";
import { z } from "zod";

export const transactionSchema = z
  .object({
    date: z
      .date()
      .refine((value) => value <= new Date(), "Date cannot be in the future")
      .refine((value) => value >= new Date("2025-01-01"), "Date is too old"),
    type: z.enum(TransactionType),
    amount: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce
        .number({
          message: "Amount is required",
        })
        .positive("Amount must be greater than 0"),
    ),
    description: z.string().optional(),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.enum(RecurringInterval).optional(),
  })
  .refine((data) => !data.isRecurring || !!data.recurringInterval, {
    path: ["recurringInterval"],
    message: "Recurring interval is required",
  });

export type TransactionFormType = z.input<typeof transactionSchema>;

export type TransactionParsedType = z.infer<typeof transactionSchema>;

export const bulkTransactionRowSchema = z.object({
  date: z
    .date()
    .refine((value) => value <= new Date(), "Date cannot be in the future")
    .refine((value) => value >= new Date("2025-01-01"), "Date is too old"),
  type: z.enum(TransactionType),
  amount: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number({
        message: "Amount is required",
      })
      .positive("Amount must be greater than 0"),
  ),
  description: z.string().optional(),
  accountId: z.string().min(1, "Account is required"),
  category: z.string().min(1, "Category is required"),
  recurring: z.enum(["NONE", ...Object.values(RecurringInterval)]),
});

export const bulkTransactionSchema = z.array(bulkTransactionRowSchema);

export type BulkTransactionRowType = z.input<typeof bulkTransactionRowSchema>;

export type BulkTransactionParsedType = z.infer<typeof bulkTransactionSchema>;

// for editable rows in the UI
export type EditableTransaction = BulkTransactionRowType & {
  id: string;
  selected?: boolean;
};
