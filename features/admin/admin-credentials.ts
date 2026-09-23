import type { User } from "@/types/user";

/**
 * Frontend-only admin access (no backend).
 * Only these credentials can enter the /dashboard admin panel.
 */
export const ADMIN_EMAIL = "admin@fashion.com";
export const ADMIN_PASSWORD = "admin123";

export function verifyAdminCredentials(email: string, password: string): User | null {
  if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return null;
  }
  const now = new Date().toISOString();
  return {
    id: "admin-1",
    email: ADMIN_EMAIL,
    name: "Store Admin",
    role: "admin",
    createdAt: now,
    updatedAt: now,
  };
}

export function isAdminUser(user: User | null | undefined): user is User & { role: "admin" } {
  return !!user && user.role === "admin";
}
