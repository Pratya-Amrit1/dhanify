import Navbar from "@/components/web/navbar/navbar";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import Footer from "./_components/Footer";

const siteUrl = "https://spend-ix.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dhanify — AI-Powered Financial Management",
    template: "%s | Dhanify",
  },
  description:
    "Track your finances with AI-powered insights, proactive alerts, and beautiful analytics dashboards.",
  keywords: [
    "AI budgeting platform",
    "financial analytics",
    "spending tracker",
    "budget automation",
    "Dhanify",
    "AI powered personalised finance assistant chatbot",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Dhanify — AI-Powered Financial Management",
    description:
      "Smart budget tracking, real-time analytics, and intelligent alerts for modern finance teams.",
    siteName: "Dhanify",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Dhanify dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhanify — AI-Powered Financial Management",
    description:
      "Smart budget tracking, real-time analytics, and intelligent alerts for modern finance teams.",
    creator: "@dhanify",
    images: [`${siteUrl}/og-image.png`],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Dhanify",
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  sameAs: [
    "https://twitter.com/dhanify",
    "https://www.linkedin.com/company/dhanify",
    "https://github.com/dhanify",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Dhanify",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema, websiteSchema]),
        }}
      />
      <header
        aria-label="Primary"
        className="fixed top-0 sm:top-4 left-1/2 sm:left-1/2 -translate-x-1/2 sm:-translate-x-1/2 z-50 w-full sm:max-w-6xl "
      >
        <div className="container mx-auto sm:rounded-full border border-border/60 bg-white/5 shadow-lg backdrop-blur-xl px-4">
          <Navbar />
        </div>
      </header>
      <main className="relative flex w-full flex-col items-center justify-start overflow-hidden bg-transparent">
        {children}
      </main>
      <Footer />
    </>
  );
}
