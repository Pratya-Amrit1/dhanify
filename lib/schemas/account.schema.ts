import { AccountType } from "@prisma/client";
import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(3, "Name is required"),
  type: z.enum(AccountType),
  balance: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce
      .number({
        message: "Amount is required",
      })
      .nonnegative("Balance cannot be negative"),
  ),
  isDefault: z.boolean().default(false),
});

// Values as they are entered on the client (before defaults are applied)
export type AccountFormType = z.input<typeof accountSchema>;

// Values after schema parsing (server-side, defaults applied)
export type AccountParsedType = z.infer<typeof accountSchema>;
