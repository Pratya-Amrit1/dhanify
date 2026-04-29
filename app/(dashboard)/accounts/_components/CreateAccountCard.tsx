"use client";

import { PlusIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import CreateAccountDrawer from "./CreateAccountDrawer";

export default function CreateAccountCard() {
  return (
    <CreateAccountDrawer>
      <Card
        role="button"
        aria-label="Create new account"
        className="
          group relative flex h-full cursor-pointer flex-col
          items-center justify-center gap-3 overflow-hidden
          rounded-xl border border-dashed border-primary/30
          bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-6 text-center
          transition-all duration-200
          hover:border-primary/60 hover:from-primary/30 hover:via-primary/10 hover:to-primary/5
          focus:outline-none focus-visible:ring-2
          focus-visible:ring-primary/60
        "
      >
        {/* Icon */}
        <div
          className="
            flex h-11 w-11 items-center justify-center
            rounded-full border
            bg-background text-muted-foreground
            transition-colors
            group-hover:border-primary/40
            group-hover:text-primary
          "
        >
          <PlusIcon className="h-5 w-5" />
        </div>

        {/* Text */}
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Create account</p>
          <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
            Add a new account to manage balances and transactions.
          </p>
        </div>
      </Card>
    </CreateAccountDrawer>
  );
}
