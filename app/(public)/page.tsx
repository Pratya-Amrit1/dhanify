import type { Metadata } from "next";

import AnalyticsSection from "./_components/AnalyticsSection";
import HeroSection from "./_components/HeroSection";

export const metadata: Metadata = {
  title: "Dhanify Landing — AI Financial Insights",
  description:
    "Discover Dhanify: AI-powered budgeting, proactive alerts, and analytics built for modern finance teams.",
};

export default function PublicPage() {
  return (
    <article
      aria-label="Dhanify marketing page"
      className="flex w-full flex-col items-center justify-center bg-transparent"
    >
      <HeroSection />
      <AnalyticsSection />
    </article>
  );
}
