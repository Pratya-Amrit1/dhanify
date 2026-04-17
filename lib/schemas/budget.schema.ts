import z from "zod";

export const budgetSchema = z.object({
  amount: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number({
        message: "Amount is required",
      })
      .nonnegative("Balance cannot be negative"),
  ),
  emailAlerts: z.boolean().optional().default(true),
});

// Values as they are entered on the client (before defaults are applied)
export type BudgetFormType = z.input<typeof budgetSchema>;

// Values after schema parsing (server-side, defaults applied)
export type BudgetParsedType = z.infer<typeof budgetSchema>;
