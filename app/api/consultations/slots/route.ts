import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  BOOKING_WINDOW_DAYS,
  CONSULTATION_DURATION_MINUTES,
  TUTOR_TIMEZONE,
  getAvailableSlots,
} from "@/lib/availability";
import { fetchBusyIntervals } from "@/lib/busyIntervals";

export async function GET() {
  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 86400000);

  const busy = await fetchBusyIntervals(admin, now.toISOString(), windowEnd.toISOString());
  const slots = getAvailableSlots(CONSULTATION_DURATION_MINUTES, busy, now).map((d) =>
    d.toISOString()
  );

  return NextResponse.json({
    slots,
    timezone: TUTOR_TIMEZONE,
    durationMinutes: CONSULTATION_DURATION_MINUTES,
  });
}
