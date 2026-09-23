export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  role?: "admin" | "customer";
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, "createdAt" | "updatedAt">;
