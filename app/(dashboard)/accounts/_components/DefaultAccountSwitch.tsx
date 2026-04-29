"use client";

import { Switch } from "@/components/ui/switch";
import { updateDefaultAccountAction } from "@/app/actions/accounts.action";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DefaultAccountSwitch({
  accountId,
  isDefault,
}: {
  accountId: string;
  isDefault: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (isDefault) {
      toast.warning("You need at least one default account");
      return;
    }

    startTransition(async () => {
      const res = await updateDefaultAccountAction(accountId);

      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(res.message);
      }
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Switch
            checked={isDefault}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label="Set as default account"
          />
        </span>
      </TooltipTrigger>

      <TooltipContent side="bottom" sideOffset={6}>
        {isDefault ? "Default account" : "Set as default account"}
      </TooltipContent>
    </Tooltip>
  );
}
