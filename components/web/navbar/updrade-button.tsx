"use client";

import { buttonVariants } from "@/components/ui/button";
import { useUserPlan } from "@/lib/hooks/useUserPlan";
import { cn } from "@/lib/cn";
import { PlanType } from "@prisma/client";
import { FaCrown } from "react-icons/fa6";

export default function UpgradeButton() {
  const tier = useUserPlan();

  if (!tier || tier === PlanType.PREMIUM) return null;

  const targetLabel = tier === PlanType.FREE ? "Get Pro" : "Get Premium";

  return (
    <span
      className={cn(
        buttonVariants({ variant: "default", size: "sm" }),
        "inline-flex items-center gap-2 rounded-full border-2",
        "bg-yellow-100 text-yellow-900 border-yellow-300 hover:bg-yellow-200 font-semibold",
        "dark:bg-yellow-800 dark:text-yellow-50 dark:border-yellow-600 hover:dark:bg-yellow-700",
      )}
    >
      <FaCrown className="w-4 h-4" />
      {targetLabel}
    </span>
  );
}
