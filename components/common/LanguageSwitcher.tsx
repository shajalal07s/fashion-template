"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "bn", label: "বাংলা", native: "বাংলা" },
] as const;

export function LanguageSwitcher({
  variant = "ghost",
  className,
}: {
  variant?: "ghost" | "outline";
  className?: string;
} = {}) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const current = LANGUAGES.find((lang) => lang.code === locale) ?? LANGUAGES[0];

  function switchTo(code: (typeof LANGUAGES)[number]["code"]) {
    if (code === locale) return;
    router.replace(pathname, { locale: code });
  }

  return (
    <div className="flex items-center">
      <span className="sr-only">{t("label")}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          openOnHover
          delay={200}
          closeDelay={100}
            render={
              <Button variant={variant} size="sm" className={className} aria-label={t("label")}>
              <Globe className="size-4" aria-hidden="true" />
              <span className="font-medium">{current.native}</span>
            </Button>
          }
        >
          {current.native}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem key={lang.code} onClick={() => switchTo(lang.code)} className="gap-2">
              {lang.native}
              {lang.code === locale ? <Check className="size-4" aria-hidden="true" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
