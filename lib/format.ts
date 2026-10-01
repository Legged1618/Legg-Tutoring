import { TUTOR_TIMEZONE } from "@/lib/availability";

/**
 * Date/time formatting pinned to the tutor's time zone. Server code runs in
 * UTC on Vercel, so a bare toLocaleString() shows times 4-5 hours off.
 */

/** "Monday, October 6, 3:00 PM EDT" */
export function formatWhen(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/** "Oct 6, 3:00 PM" */
export function formatShort(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "October 6, 2026" */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** A session's payment state for the admin views: "Paid $65.00", "Not paid yet", etc. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase rows are untyped here
export function sessionPaymentLabel(s: Record<string, any>): string {
  const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  if (s.status === "pending_payment") return "Not paid yet";
  if (s.refund_cents > 0) return `Paid ${dollars(s.amount_paid_cents)}, refunded ${dollars(s.refund_cents)}`;
  if (s.amount_paid_cents > 0) return `Paid ${dollars(s.amount_paid_cents)}`;
  return "Not paid";
}
