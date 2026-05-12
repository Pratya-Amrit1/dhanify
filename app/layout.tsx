import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/web/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ClientProviders } from "@/components/web/client-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://dhanify-t1p8.vercel.app"
  ),
  title: {
    default: "Dhanify - Personal Finance Made Simple",
    template: "%s | Dhanify",
  },
  description:
    "Dhanify is your ultimate AI-powered personal finance assistant. Track expenses, manage budgets, and gain insights into your financial health effortlessly.",
  keywords: [
    "personal finance",
    "expense tracker",
    "budgeting app",
    "finance assistant",
    "money management",
    "wealth tracker",
  ],
  authors: [{ name: "Dhanify Team" }],
  creator: "Dhanify",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Dhanify - Personal Finance Made Simple",
    description:
      "Take control of your finances with Dhanify's AI-powered insights, budget tracking, and smart financial management tools.",
    siteName: "Dhanify",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dhanify - Personal Finance Made Simple",
    description:
      "Take control of your finances with Dhanify's AI-powered insights, budget tracking, and smart financial management tools.",
  },
  verification: {
    google: "oV18YApn_X1uwLqMR7nOic9o617Gka7c1EfmlCPZJEs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientProviders>{children}</ClientProviders>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
