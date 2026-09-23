import type { SupabaseClient } from "@supabase/supabase-js";
import { CONSULTATION_DURATION_MINUTES, type BusyInterval } from "@/lib/availability";

const PENDING_PAYMENT_HOLD_MINUTES = 30;

/**
 * Every booked consultation and paid session in the given window, as busy
 * [start, end) intervals -- the shared "is the tutor free" check for both
 * booking flows. A `pending_payment` session only blocks its slot for a
 * short hold window (it's an abandoned Stripe Checkout otherwise, and
 * shouldn't squat the slot forever).
 */
export async function fetchBusyIntervals(
  admin: SupabaseClient,
  rangeStart: string,
  rangeEnd: string
): Promise<BusyInterval[]> {
  const pendingCutoff = new Date(Date.now() - PENDING_PAYMENT_HOLD_MINUTES * 60000).toISOString();

  const [{ data: consultations }, { data: sessions }] = await Promise.all([
    admin
      .from("consultations")
      .select("scheduled_at")
      .eq("status", "scheduled")
      .gte("scheduled_at", rangeStart)
      .lte("scheduled_at", rangeEnd),
    admin
      .from("sessions")
      .select("scheduled_at, duration_minutes")
      .or(`status.eq.scheduled,and(status.eq.pending_payment,created_at.gte.${pendingCutoff})`)
      .gte("scheduled_at", rangeStart)
      .lte("scheduled_at", rangeEnd),
  ]);

  const busy: BusyInterval[] = [];

  for (const c of (consultations ?? []) as { scheduled_at: string }[]) {
    const start = new Date(c.scheduled_at);
    busy.push({ start, end: new Date(start.getTime() + CONSULTATION_DURATION_MINUTES * 60000) });
  }

  for (const s of (sessions ?? []) as { scheduled_at: string; duration_minutes: number }[]) {
    const start = new Date(s.scheduled_at);
    busy.push({ start, end: new Date(start.getTime() + s.duration_minutes * 60000) });
  }

  return busy;
}
