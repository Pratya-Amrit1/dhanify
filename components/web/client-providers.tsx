"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark, shadcn } from "@clerk/themes";
import { useTheme } from "next-themes";
import type { PropsWithChildren } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
  const { resolvedTheme } = useTheme();
  const baseTheme = resolvedTheme === "dark" ? dark : shadcn;

  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: "#22c55e" },
        baseTheme,
      }}
    >
      {children}
    </ClerkProvider>
  );
}
