import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import {
  BOOKING_WINDOW_DAYS,
  SESSION_DURATIONS_MINUTES,
  TUTOR_TIMEZONE,
  getAvailableSlots,
} from "@/lib/availability";
import { fetchBusyIntervals } from "@/lib/busyIntervals";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);

  if (!client.approved) {
    return NextResponse.json(
      { error: "Your account isn't approved for booking yet." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const durationMinutes = Number(searchParams.get("duration"));

  if (!SESSION_DURATIONS_MINUTES.includes(durationMinutes as (typeof SESSION_DURATIONS_MINUTES)[number])) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 86400000);
  const busy = await fetchBusyIntervals(admin, now.toISOString(), windowEnd.toISOString());
  const slots = getAvailableSlots(durationMinutes, busy, now).map((d) => d.toISOString());

  return NextResponse.json({ slots, timezone: TUTOR_TIMEZONE, durationMinutes });
}
