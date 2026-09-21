/**
 * All money amounts are in cents (Stripe convention) to avoid float rounding bugs.
 * TODO(ed): fill in real numbers once decided in the "Consultation Script & Policy" doc.
 */
export const PRICING = {
  virtualHourlyRateCents: 0, // TODO: e.g. 6000 = $60/hr
  inPersonHourlyRateCents: 0, // TODO
  lateCancelFlatFeeCents: 0, // TODO: fee charged for cancellations inside the 24h window
  currency: "usd",
} as const;

export const CANCELLATION_WINDOW_HOURS = 24;

export function hoursUntil(date: Date, now: Date = new Date()): number {
  return (date.getTime() - now.getTime()) / (1000 * 60 * 60);
}

export type CancelledBy = "client" | "tutor";

/**
 * Returns the refund amount (in cents) owed for a cancellation, given who
 * cancelled, how much was originally charged, and how far out the session is.
 */
export function computeRefundCents(params: {
  cancelledBy: CancelledBy;
  amountPaidCents: number;
  sessionStart: Date;
  now?: Date;
}): number {
  const { cancelledBy, amountPaidCents, sessionStart, now = new Date() } = params;

  if (cancelledBy === "tutor") {
    // Tutor-initiated cancellations are always refunded in full, automatically.
    return amountPaidCents;
  }

  const hoursOut = hoursUntil(sessionStart, now);
  if (hoursOut >= CANCELLATION_WINDOW_HOURS) {
    return amountPaidCents;
  }

  // Inside the cancellation window: flat fee is withheld, rest refunded.
  return Math.max(0, amountPaidCents - PRICING.lateCancelFlatFeeCents);
}
