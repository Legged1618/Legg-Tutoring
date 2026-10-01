import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { fetchBusyIntervals } from "@/lib/busyIntervals";
import { BOOKING_WINDOW_DAYS, SESSION_DURATIONS_MINUTES, TUTOR_TIMEZONE, getAvailableSlots } from "@/lib/availability";
import { computeCalendarWindow, dateKeyFor } from "@/lib/calendarWindow";
import ClientCalendarGrid, { type ClientCalendarDay } from "@/components/ClientCalendarGrid";

const WINDOW_DAYS = 28;

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; start?: string }>;
}) {
  const { booked, start } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const isTutor = Boolean(
    process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  if (isTutor) {
    redirect("/portal/admin");
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);
  const approved = client.approved;

  const now = new Date();
  const { windowStartKey, mondayKey, boundaries, dayMeta, rangeLabel, prevKey, nextKey } =
    computeCalendarWindow(WINDOW_DAYS, start, now);

  const { count: unreadMessages } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("sender", "tutor")
    .is("read_at", null);

  const { data: sessions } = await admin
    .from("sessions")
    .select("*")
    .eq("client_id", client.id)
    .gte("scheduled_at", boundaries[0].toISOString())
    .lt("scheduled_at", boundaries[WINDOW_DAYS].toISOString())
    .order("scheduled_at", { ascending: true });

  const sessionsByDate = new Map<
    string,
    { id: string; timeLabel: string; title: string; status: string }[]
  >();
  for (const s of (sessions ?? []) as Record<string, any>[]) {
    const startDate = new Date(s.scheduled_at);
    const dateKey = dateKeyFor(startDate);
    if (!sessionsByDate.has(dateKey)) sessionsByDate.set(dateKey, []);
    sessionsByDate.get(dateKey)!.push({
      id: s.id,
      timeLabel: startDate.toLocaleTimeString("en-US", {
        timeZone: TUTOR_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
      }),
      title: `${s.duration_minutes} min ${s.type === "virtual" ? "virtual session" : "session"}`,
      status: s.status,
    });
  }

  // Which days have any open slot at all, for any duration -- independent
  // of which 4-week window is currently on screen, since it's always
  // relative to "now", not to the page being viewed.
  const bookableDateKeys = new Set<string>();
  if (approved) {
    const horizonEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 86400000);
    const busy = await fetchBusyIntervals(admin, now.toISOString(), horizonEnd.toISOString());
    for (const duration of SESSION_DURATIONS_MINUTES) {
      for (const slot of getAvailableSlots(duration, busy, now)) {
        bookableDateKeys.add(dateKeyFor(slot));
      }
    }
  }

  const days: ClientCalendarDay[] = dayMeta.map((meta) => ({
    ...meta,
    isToday: meta.dateKey === dateKeyFor(now),
    isBookable: bookableDateKeys.has(meta.dateKey),
    sessions: sessionsByDate.get(meta.dateKey) ?? [],
  }));

  return (
    <div className="portal-shell wrap">
      <div className="section-head">
        <h2>Your sessions</h2>
        <p>{user.email}</p>
      </div>

      <div className="portal-head-actions">
        <Link href="/portal/messages" className="btn btn-secondary" style={{ width: "auto" }}>
          {unreadMessages ? `Messages (${unreadMessages} new)` : "Ask a question"}
        </Link>
      </div>

      {booked === "1" && (
        <p className="notice success" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
          Booking successful! You&apos;ll be able to join your session 10 minutes before it begins.
        </p>
      )}

      {!approved && (
        <p className="notice" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
          Book a free consultation call on the <Link href="/">main page</Link> to get started. If
          Legg Tutoring is a good fit for your needs, you&apos;ll book sessions on this page.
        </p>
      )}

      <ClientCalendarGrid
        days={days}
        rangeLabel={rangeLabel}
        prevHref={`/portal?start=${prevKey}`}
        nextHref={`/portal?start=${nextKey}`}
        todayHref="/portal"
        isTodayWindow={windowStartKey === mondayKey}
        approved={approved}
      />

      <p className="policy-note" style={{ marginTop: 24 }}>
        Cancel your session with at least 24 hours notice for a full refund. If you cancel within
        24 hours, you&apos;ll still receive a full refund for the session with a $10 cancellation
        fee. If your tutor cancels, you&apos;ll be refunded in full automatically.
      </p>
    </div>
  );
}
