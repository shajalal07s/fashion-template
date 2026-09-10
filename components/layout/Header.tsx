"use client";

import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/common/Container";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { Logo } from "@/components/common/Logo";
import { Navbar } from "@/components/layout/Navbar";
import { HeaderAccount } from "@/components/layout/header/HeaderAccount";
import { HeaderCart } from "@/components/layout/header/HeaderCart";
import { HeaderSearch } from "@/components/layout/header/HeaderSearch";
import { HeaderWishlist } from "@/components/layout/header/HeaderWishlist";
import { MobileNav } from "@/components/layout/header/MobileNav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const t = useTranslations("Header");
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label={t("openMenu")}
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0">
              <SheetTitle className="sr-only">{t("mobileNav")}</SheetTitle>
              <div className="flex h-full min-h-0 flex-col">
                <MobileNav onNavigate={() => setOpen(false)} />
                <div className="shrink-0 border-t px-5 py-4">
                  <LanguageSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        <Navbar />

        <div className="flex items-center gap-0.5">
          <LanguageSwitcher />
          <HeaderSearch />
          <HeaderWishlist />
          <HeaderCart />
          <HeaderAccount />
        </div>
      </Container>
    </header>
  );
}
