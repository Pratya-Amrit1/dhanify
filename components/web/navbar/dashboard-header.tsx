"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/web/mode-toggle";
import UpgradeButton from "./updrade-button";
import Link from "next/link";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  transactions: "Transactions",
  budgets: "Budgets",
  recurring: "Recurring",
  settings: "Settings",
};

export function DashboardHeader() {
  const segment = useSelectedLayoutSegment();

  const title = segment
    ? (TITLES[segment] ?? capitalize(segment))
    : "Dashboard";

  return (
    <div className="mb-4 flex items-center justify-between gap-2 bg-secondary/30 border-b border-border pl-2 py-3 pr-4 sm:pr-6 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <span className="mx-2 h-5 w-[2px] bg-border" aria-hidden="true" />
        <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
      </div>
      <div className="flex item-center gap-4">
        <Link href="/pricing" className="hidden sm:inline-flex">
          <UpgradeButton />
        </Link>
        <ModeToggle />
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
