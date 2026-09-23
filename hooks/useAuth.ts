"use client";

import { useRouter } from "@/i18n/navigation";
import { useAuthStore } from "@/store/auth.store";
import { STORAGE_KEYS, ROUTES } from "@/lib/constants";
import { setAccessToken } from "@/lib/axios";

interface UseAuthReturn {
  user: ReturnType<typeof useAuthStore.getState>["user"];
  isAuthenticated: boolean;
  login: (user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>) => void;
  logout: (redirect?: boolean) => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  // Derived from the persisted user so the session survives page refresh.
  const isAuthenticated = user !== null;
  const login = useAuthStore((state) => state.login);
  const logoutStore = useAuthStore((state) => state.logout);

  const logout = (redirect = true) => {
    logoutStore();
    setAccessToken(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEYS.accessToken);
      window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
    }
    if (redirect) {
      router.push(ROUTES.login);
    }
  };

  return { user, isAuthenticated, login, logout };
}
