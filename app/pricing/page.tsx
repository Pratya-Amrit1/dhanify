import Link from "next/link";

import { PricingTable } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type PricingPageProps = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams;
  const redirectUrl = params?.redirect ?? "/dashboard";

  console.log("Redirect URL:", redirectUrl); // Debug log to verify the redirect URL

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background/80 to-background px-4 py-12 flex justify-center">
      <section className="w-full max-w-6xl space-y-10">
        <div>
          <Link
            href={redirectUrl}
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "w-fit",
            )}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back</span>
          </Link>
        </div>
        <header className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Simple pricing</span>
            <span className="hidden sm:inline">• Built for individuals</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
              Level up how you manage money
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Start on the Free plan, then upgrade when you&apos;re ready for
              powerful automations like recurring transactions, insights, and
              advanced reporting.
            </p>
          </div>
        </header>

        <div className="rounded-3xl border bg-card/70 shadow-lg shadow-black/5 p-3 sm:p-6 md:p-8 backdrop-blur">
          <PricingTable newSubscriptionRedirectUrl={`${redirectUrl}`} />
        </div>

        <div className="grid gap-4 text-xs sm:text-sm text-muted-foreground md:grid-cols-3">
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium text-foreground">
              Built for clarity
            </span>
            <span>
              See all your accounts, budgets, and transactions in one clean
              dashboard.
            </span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium text-foreground">
              Flexible as you grow
            </span>
            <span>
              Start solo and scale to more advanced workflows without switching
              tools.
            </span>
          </div>
          <div className="flex flex-col items-start gap-1">
            <span className="font-medium text-foreground">Cancel anytime</span>
            <span>
              Change or cancel your plan in a couple of clicks from settings.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
