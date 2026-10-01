/** Same-site redirect targets only: "/portal/..." yes, "//evil.com" no. */
export function safeNext(next: string | null, fallback: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
