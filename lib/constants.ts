export const STORAGE_KEYS = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  user: "user",
} as const;

export const PRODUCTS_PER_PAGE = 12;

export const DEFAULT_PAGE_SIZE = 10;

export const ROUTES = {
  home: "/",
  shop: "/shop",
  cart: "/cart",
  checkout: "/checkout",
  login: "/login",
  register: "/register",
  adminLogin: "/admin-login",
  dashboard: "/dashboard",
} as const;
