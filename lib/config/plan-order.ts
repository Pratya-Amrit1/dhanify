import { PlanType } from "@prisma/client";

export const PLAN_ORDER: PlanType[] = [
  PlanType.FREE,
  PlanType.PRO,
  PlanType.PREMIUM,
];

export function isPlanSufficient(
  userPlan: PlanType,
  requiredPlan: PlanType,
): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}
