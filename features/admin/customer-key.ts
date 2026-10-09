/** URL-safe opaque key for customer emails (dots/@ break the middleware matcher). */
export function encodeCustomerKey(email: string): string {
  return btoa(email).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCustomerKey(key: string): string {
  try {
    let s = key.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return atob(s);
  } catch {
    return "";
  }
}
