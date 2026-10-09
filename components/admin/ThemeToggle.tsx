"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline";
  className?: string;
} = {}) {
  const t = useTranslations("Dashboard.admin");
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <Button
      variant={variant}
      size="icon"
      className={className}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? t("topbar.themeLight") : t("topbar.themeDark")}
      title={dark ? t("topbar.themeLight") : t("topbar.themeDark")}
    >
      {dark ? (
        <Sun className="size-5" aria-hidden="true" />
      ) : (
        <Moon className="size-5" aria-hidden="true" />
      )}
    </Button>
  );
}
