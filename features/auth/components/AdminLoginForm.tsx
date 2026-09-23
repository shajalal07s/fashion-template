"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/auth.schema";
import { ADMIN_EMAIL, ADMIN_PASSWORD, verifyAdminCredentials } from "@/features/admin/admin-credentials";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";

export function AdminLoginForm() {
  const t = useTranslations("Auth.adminLogin");
  const tValidation = useTranslations("Auth.validation");

  const router = useRouter();
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema(tValidation)),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const admin = verifyAdminCredentials(values.email, values.password);
    setIsSubmitting(false);

    if (!admin) {
      toast.error(t("invalidError"));
      return;
    }

    login(admin);
    toast.success(t("successToast"));
    router.push(ROUTES.dashboard);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-secondary/10 px-3 py-2.5 text-sm font-medium text-foreground">
          <ShieldCheck className="size-4 shrink-0 text-secondary" aria-hidden="true" />
          {t("secureNote")}
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  autoComplete="username"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isSubmitting ? t("submitting") : t("button")}
        </Button>
        <div className="bg-muted/50 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-xs">
          <span className="text-muted-foreground">{t("demoHint")}</span>
          <code className="text-foreground font-mono font-semibold">{ADMIN_EMAIL}</code>
          <span className="text-muted-foreground">/</span>
          <code className="text-foreground font-mono font-semibold">{ADMIN_PASSWORD}</code>
        </div>
      </form>
    </Form>
  );
}
