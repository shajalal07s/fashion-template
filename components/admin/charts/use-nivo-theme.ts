"use client";

import { useTheme } from "next-themes";
import { nivoTheme, nivoThemeDark } from "@/components/admin/charts/nivo-theme";

export function useNivoTheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? nivoThemeDark : nivoTheme;
}
