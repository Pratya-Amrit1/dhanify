import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { PlanType } from "@prisma/client";

export function useUserPlan(): PlanType {
  const { has } = useAuth();
  const [plan, setPlan] = useState<PlanType>(PlanType.FREE);

  useEffect(() => {
    if (!has) return;

    let active = true;

    Promise.all([has({ plan: "premium" }), has({ plan: "pro" })])
      .then(([isPremium, isPro]) => {
        if (!active) return;

        if (isPremium) setPlan(PlanType.PREMIUM);
        else if (isPro) setPlan(PlanType.PRO);
        else setPlan(PlanType.FREE);
      })
      .catch(() => setPlan(PlanType.FREE));

    return () => {
      active = false;
    };
  }, [has]);

  return plan;
}
