import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TUTOR_TIMEZONE, zonedWallTimeToUtc, shiftDateKey } from "@/lib/availability";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(
    user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );
  if (!isTutor) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const formData = await request.formData();
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || startDate);
  const reason = formData.get("reason");

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate) || endDate < startDate) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const startsAt = zonedWallTimeToUtc(sy, sm, sd, 0, 0, TUTOR_TIMEZONE);

  // End date is inclusive from the tutor's point of view -- block through
  // the end of that day, i.e. up to (but not including) the next day.
  const [ey, em, ed] = shiftDateKey(endDate, 1).split("-").map(Number);
  const endsAt = zonedWallTimeToUtc(ey, em, ed, 0, 0, TUTOR_TIMEZONE);

  const admin = createAdminClient();
  await admin.from("time_off").insert({
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: typeof reason === "string" && reason.trim() ? reason.trim() : null,
  });

  const next = new URL(request.url).searchParams.get("next");
  return NextResponse.redirect(new URL(next || "/portal/admin/calendar", request.url), {
    status: 303,
  });
}
