import { FEATURE_MIN_PLAN } from "../config/feature-requirements";
import { isPlanSufficient } from "../config/plan-order";
import { FeatureKey } from "../config/features";
import { useUserPlan } from "./useUserPlan";

export function useFeature(feature: FeatureKey) {
  const plan = useUserPlan();

  const requiredPlan = FEATURE_MIN_PLAN[feature];

  return isPlanSufficient(plan, requiredPlan);
}
