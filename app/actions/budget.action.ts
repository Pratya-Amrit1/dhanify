"use server";

import { ErrorCode } from "@/lib/constants/error-codes";
import { requireUser } from "@/lib/data/users/auth";
import { createOrUpdateBudgetForUser } from "@/lib/data/budget/mutaions";
import { budgetSchema } from "@/lib/schemas/budget.schema";
import { mapDomainError } from "@/lib/utils/mapDomainError";
import { revalidatePath } from "next/cache";

type ResponseResult =
  | { success: true; message: string }
  | { success: false; error: string };

// create or update budget server action
export async function createOrUpdateBudgetAction(
  data: unknown,
): Promise<ResponseResult> {
  const parsed = budgetSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: ErrorCode.INVALID_FORM_DATA };
  }

  let action: string = <"created" | "updated">"created";

  try {
    const user = await requireUser();

    const { amount } = parsed.data;

    action = await createOrUpdateBudgetForUser(user.id, amount);

    revalidatePath("/budget");
    revalidatePath("/dashboard");
    return { success: true, message: `Budget ${action} successfully` };
  } catch (error) {
    // Map known domain errors
    const mapped = mapDomainError(error);

    if (mapped) {
      return { success: false, error: mapped.error };
    }

    if (action === "created") {
      return { success: false, error: ErrorCode.BUDGET_CREATION_FAILED };
    }
    return { success: false, error: ErrorCode.BUDGET_UPDATE_FAILED };
  }
}
