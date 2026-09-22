import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  BOOKING_WINDOW_DAYS,
  CONSULTATION_DURATION_MINUTES,
  TUTOR_TIMEZONE,
  getAvailableSlots,
} from "@/lib/availability";

export async function GET() {
  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 86400000);

  const { data: booked, error } = await admin
    .from("consultations")
    .select("scheduled_at")
    .eq("status", "scheduled")
    .gte("scheduled_at", now.toISOString())
    .lte("scheduled_at", windowEnd.toISOString());

  if (error) {
    return NextResponse.json({ error: "Could not load availability." }, { status: 500 });
  }

  const bookedEpochMs = new Set<number>(
    ((booked ?? []) as { scheduled_at: string }[]).map((row) =>
      new Date(row.scheduled_at).getTime()
    )
  );

  const slots = getAvailableSlots(bookedEpochMs, now).map((d) => d.toISOString());

  return NextResponse.json({
    slots,
    timezone: TUTOR_TIMEZONE,
    durationMinutes: CONSULTATION_DURATION_MINUTES,
  });
}
