import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { fetchBusyIntervals } from "@/lib/busyIntervals";
import {
  BOOKING_WINDOW_DAYS,
  SESSION_DURATIONS_MINUTES,
  SESSION_MIN_NOTICE_HOURS,
  TUTOR_TIMEZONE,
  getAvailableSlots,
} from "@/lib/availability";
import { computeCalendarWindow, dateKeyFor } from "@/lib/calendarWindow";
import ClientCalendarGrid, { type ClientCalendarDay } from "@/components/ClientCalendarGrid";
import LiveRefresh from "@/components/LiveRefresh";
import { formatDay, formatTime } from "@/lib/format";

const WINDOW_DAYS = 28;

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string; cancelled?: string; start?: string }>;
}) {
  const { booked, cancelled, start } = await searchParams;
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
  const { windowStartKey, mondayKey, todayKey, boundaries, dayMeta, rangeLabel, prevKey, nextKey } =
    computeCalendarWindow(WINDOW_DAYS, start, now);

  const { count: unreadMessages } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id)
    .eq("sender", "tutor")
    .is("read_at", null);

  // The next session still ahead, wherever it falls, for the card up top.
  const { data: nextSession } = await admin
    .from("sessions")
    .select("id, scheduled_at, duration_minutes")
    .eq("client_id", client.id)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date(now.getTime() - 2 * 3600000).toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .maybeSingle();

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
      for (const slot of getAvailableSlots(duration, busy, now, SESSION_MIN_NOTICE_HOURS)) {
        bookableDateKeys.add(dateKeyFor(slot));
      }
    }
  }

  const days: ClientCalendarDay[] = dayMeta.map((meta) => ({
    ...meta,
    isToday: meta.dateKey === todayKey,
    isBookable: bookableDateKeys.has(meta.dateKey),
    sessions: sessionsByDate.get(meta.dateKey) ?? [],
  }));

  return (
    <div className="portal-shell wrap">
      <LiveRefresh seconds={60} />
      <div className="section-head">
        <h2>Your sessions</h2>
        <p>{user.email}</p>
      </div>

      {booked === "1" && (
        <p className="notice success portal-banner">
          Booking successful! You&apos;ll be able to join your session 10 minutes before it begins.
        </p>
      )}

      {cancelled === "1" && (
        <p className="notice portal-banner">
          Checkout was cancelled, no charge made. Pick a time below whenever you&apos;re ready.
        </p>
      )}

      {!approved && (
        <p className="notice portal-banner">
          Book a free consultation call on the <Link href="/">main page</Link> to get started. If
          Legg Tutoring is a good fit for your needs, you&apos;ll book sessions on this page.
        </p>
      )}

      <div className="portal-summary">
        {nextSession ? (
          <div className="next-card">
            <span className="next-card-eyebrow">Next session</span>
            <strong className="next-card-when">
              {formatDay(new Date(nextSession.scheduled_at))}
            </strong>
            <span className="next-card-time">
              {formatTime(new Date(nextSession.scheduled_at))} &middot; {nextSession.duration_minutes} min
            </span>
            <div className="next-card-actions">
              <Link href={`/portal/session/${nextSession.id}`} className="btn btn-auto btn-sm">
                Join
              </Link>
              <Link
                href={`/portal/messages?session=${nextSession.id}`}
                className="btn btn-secondary btn-auto btn-sm"
              >
                Message
              </Link>
            </div>
          </div>
        ) : (
          <div className="next-card empty">
            <span className="next-card-eyebrow">Next session</span>
            <span className="next-card-time">Nothing booked yet.</span>
          </div>
        )}
        <Link href="/portal/messages" className={`inbox-card${unreadMessages ? " has-new" : ""}`}>
          <span className="next-card-eyebrow">Messages</span>
          <strong className="next-card-when">
            {unreadMessages ? `Messages (${unreadMessages} new)` : "Ask a question"}
          </strong>
          <span className="inbox-card-arrow" aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <ClientCalendarGrid
        days={days}
        rangeLabel={rangeLabel}
        prevHref={`/portal?start=${prevKey}`}
        nextHref={`/portal?start=${nextKey}`}
        todayHref="/portal"
        isTodayWindow={windowStartKey === mondayKey}
        approved={approved}
        todayKey={todayKey}
      />

      <p className="policy-note">
        Cancel your session with at least 24 hours notice for a full refund. If you cancel within
        24 hours, you&apos;ll still receive a full refund for the session with a $10 cancellation
        fee. If your tutor cancels, you&apos;ll be refunded in full automatically.
      </p>
    </div>
  );
}
