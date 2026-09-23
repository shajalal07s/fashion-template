"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { isAdminUser } from "@/features/admin/admin-credentials";
import { ROUTES } from "@/lib/constants";
import { useRouter } from "@/i18n/navigation";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const hydrated = useSyncExternalStore(
    (onStoreChange) => useAuthStore.persist.onFinishHydration(onStoreChange),
    () => useAuthStore.persist.hasHydrated(),
    () => false
  );
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && isAdminUser(user);
  const ready = mounted && hydrated;

  useEffect(() => {
    if (ready && !isAdmin) {
      router.replace(ROUTES.adminLogin);
    }
  }, [ready, isAdmin, router]);

  if (!ready || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Loader2 className="size-8 animate-spin text-secondary" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenu={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
