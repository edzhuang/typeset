"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useMemo } from "react";

export function ThemedClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  // Memoize the appearance object to prevent unnecessary re-renders
  // ClerkProvider handles appearance updates without remounting
  const appearance = useMemo(
    () => ({
      baseTheme: resolvedTheme === "dark" ? dark : undefined,
      cssLayerName: "clerk" as const,
    }),
    [resolvedTheme]
  );

  return <ClerkProvider appearance={appearance}>{children}</ClerkProvider>;
}
