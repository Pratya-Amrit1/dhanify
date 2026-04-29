"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  type LucideIcon,
  LayoutDashboard,
  CreditCard,
  Wallet,
  Repeat,
  Settings,
  Plus,
  PiggyBank,
  ChartPie,
  CircleFadingArrowUp,
} from "lucide-react";
import { FaCrown } from "react-icons/fa6";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import UserDropdown from "@/components/web/user-dropdown";
import { FEATURES, type FeatureKey } from "@/lib/config/features";
import { useFeature } from "@/lib/hooks/useFeature";

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  feature?: FeatureKey;
  upgradeSlug?: string;
  description?: string;
};

const items: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: CreditCard,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: Wallet,
  },
  {
    title: "Budget",
    url: "/budget",
    icon: ChartPie,
  },
  {
    title: "Recurring",
    url: "/recurrings",
    icon: Repeat,
    feature: FEATURES.RECURRING_TRANSACTIONS,
    upgradeSlug: "recurring-automation",
    description:
      "Track every subscription and predict cash flow automatically.",
  },
  {
    title: "AI Imports",
    url: "/ai-imports",
    icon: CircleFadingArrowUp,
    feature: FEATURES.AI_BULK_INSERT,
    upgradeSlug: "ai-imports",
    description: "Bulk import statements, auto-tag, and clean data with AI.",
  },
];

const featurePlanMap: Partial<Record<FeatureKey, "pro" | "premium">> = {
  [FEATURES.RECURRING_TRANSACTIONS]: "pro",
  [FEATURES.AI_BULK_INSERT]: "premium",
};

const premiumSpotlights: Partial<
  Record<
    FeatureKey,
    {
      eyebrow: string;
      description: string;
      benefits: string[];
      cta: string;
    }
  >
> = {
  [FEATURES.RECURRING_TRANSACTIONS]: {
    eyebrow: "Smart Automations",
    description: "Automatically track your recurring bills and subscriptions.",
    benefits: [
      "Detect monthly bills and subscriptions automatically",
      "Know upcoming payments before they happen",
    ],
    cta: "Upgrade to Pro",
  },

  [FEATURES.AI_BULK_INSERT]: {
    eyebrow: "AI Imports",
    description: "Scan transaction screenshots and let AI add them for you.",
    benefits: [
      "Upload Payment app screenshots",
      "AI reads and saves expenses instantly",
    ],
    cta: "Upgrade to Premium",
  },
};

export function AppSidebar() {
  const { openUserProfile } = useClerk();
  const pathname = usePathname();
  const router = useRouter();
  const canUseRecurring = useFeature(FEATURES.RECURRING_TRANSACTIONS);
  const canUseAiImports = useFeature(FEATURES.AI_BULK_INSERT);

  const featureAvailability: Partial<Record<FeatureKey, boolean>> = {
    [FEATURES.RECURRING_TRANSACTIONS]: canUseRecurring,
    [FEATURES.AI_BULK_INSERT]: canUseAiImports,
  };

  const buildUpgradeHref = (item: NavItem) => {
    const slug =
      item.upgradeSlug ?? item.title.toLowerCase().replace(/\s+/g, "-");
    const plan = item.feature ? featurePlanMap[item.feature] : undefined;
    return `/pricing?redirect=${item.url}&plan=${plan ?? "premium"}&feature=${slug}`;
  };

  const handleLockedNavigation = (
    event: MouseEvent<HTMLElement>,
    item: NavItem,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(buildUpgradeHref(item));
  };

  return (
    <Sidebar>
      <SidebarContent>
        {/* App brand */}
        <div className="px-3 py-4 bg-secondary/30 border-b border-border">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="inline-block rounded-md bg-primary/10 px-2 py-1 text-primary">
              <PiggyBank className="h-5 w-5 text-primary" />
            </span>
            <span className="text-black dark:text-white">Dhanify</span>
          </Link>
        </div>

        {/* Primary action */}
        <div className="px-3 pt-4">
          <Button asChild className="w-full justify-start gap-2" size="sm">
            <Link href="/transactions/create">
              <Plus className="h-4 w-4" />
              <span>Add transaction</span>
            </Link>
          </Button>
        </div>

        {/* Main App Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.url || pathname?.startsWith(`${item.url}/`);
                const isLocked = Boolean(
                  item.feature && featureAvailability[item.feature] === false,
                );
                const spotlight = item.feature
                  ? premiumSpotlights[item.feature]
                  : undefined;

                const unlockedButton = (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="transition-transform hover:scale-[1.01]"
                  >
                    <Link href={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                );

                const lockedButton = (
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className="bg-background transition-colors hover:bg-amber-100/70 hover:scale-[1.01] dark:hover:bg-amber-400/10"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-left"
                      onClick={(event) => handleLockedNavigation(event, item)}
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{item.title}</span>
                        <FaCrown className="h-4 w-4 text-amber-600 " />
                      </span>
                    </button>
                  </SidebarMenuButton>
                );

                return (
                  <SidebarMenuItem key={item.title}>
                    {isLocked ? (
                      <HoverCard openDelay={50} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          {lockedButton}
                        </HoverCardTrigger>
                        <HoverCardContent
                          side="right"
                          align="start"
                          className="w-72 space-y-3 text-left bg-amber-50 border-amber-200 dark:bg-popover dark:border-border shadow-lg"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-300">
                            <FaCrown className="h-3.5 w-3.5" />
                            <span>
                              {spotlight?.eyebrow ?? "Premium Feature"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {spotlight?.description ??
                                "Upgrade to unlock this premium automation."}
                            </p>
                          </div>
                          {spotlight?.benefits && (
                            <ul className="space-y-1 text-xs text-muted-foreground">
                              {spotlight.benefits.map((benefit) => (
                                <li
                                  key={benefit}
                                  className="flex items-start gap-1"
                                >
                                  <span className="text-amber-500">•</span>
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            onClick={(event) =>
                              handleLockedNavigation(event, item)
                            }
                          >
                            {spotlight?.cta ?? "Upgrade to Premium"}
                          </Button>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      unlockedButton
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup>
          <SidebarGroupLabel>Preferences</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => openUserProfile()}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <UserDropdown variant="sidebar" />
      </SidebarFooter>
    </Sidebar>
  );
}
