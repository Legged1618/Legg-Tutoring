import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";
import AdminCalendarGrid, { type CalendarDay, type CalendarEntry } from "@/components/AdminCalendarGrid";
import { TUTOR_TIMEZONE } from "@/lib/availability";
import { sessionPaymentLabel } from "@/lib/format";
import { computeCalendarWindow, dateKeyFor } from "@/lib/calendarWindow";
import { consultationMeetingUrl } from "@/lib/consultationMeeting";

// A multiple of 7 -- keeps Previous/Next always landing on a Monday,
// instead of drifting off the week grid a couple days at a time.
const WINDOW_DAYS = 28;

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isTutor = Boolean(
    user && process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  if (!user) {
    redirect("/portal/login");
  }

  if (!isTutor) {
    return (
      <div className="portal-shell wrap">
        <p className="notice error">This page is only for the tutor account.</p>
      </div>
    );
  }

  const now = new Date();
  const { windowStartKey, mondayKey, todayKey, boundaries, dayMeta, rangeLabel, prevKey, nextKey } =
    computeCalendarWindow(WINDOW_DAYS, start, now);

  const rangeStart = boundaries[0].toISOString();
  const rangeEnd = boundaries[WINDOW_DAYS].toISOString();
  const scriptUrl = process.env.CALL_SCRIPT_URL;
  const meetingUrl = consultationMeetingUrl();

  const admin = createAdminClient();
  const [{ data: consultations }, { data: sessions }, { data: timeOff }, { data: clientRows }] = await Promise.all([
    admin
      .from("consultations")
      .select("*")
      .gte("scheduled_at", rangeStart)
      .lt("scheduled_at", rangeEnd),
    admin
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .gte("scheduled_at", rangeStart)
      .lt("scheduled_at", rangeEnd),
    admin
      .from("time_off")
      .select("*")
      .lt("starts_at", rangeEnd)
      .gt("ends_at", rangeStart)
      .order("starts_at", { ascending: true }),
    admin.from("clients").select("id, email"),
  ]);

  // Consultations are keyed by email, not client id, so map them over to
  // link each booking to its client page.
  const clientIdByEmail = new Map(
    ((clientRows ?? []) as { id: string; email: string }[]).map((c) => [c.email, c.id])
  );

  const entriesByDate = new Map<string, CalendarEntry[]>();

  function push(dateKey: string, entry: CalendarEntry) {
    if (!entriesByDate.has(dateKey)) entriesByDate.set(dateKey, []);
    entriesByDate.get(dateKey)!.push(entry);
  }

  for (const c of (consultations ?? []) as Record<string, any>[]) {
    const startDate = new Date(c.scheduled_at);
    const resolved = c.status !== "scheduled" || startDate.getTime() < now.getTime();
    push(dateKeyFor(startDate), {
      id: c.id,
      kind: "consultation",
      startIso: startDate.toISOString(),
      timeLabel: startDate.toLocaleTimeString("en-US", {
        timeZone: TUTOR_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
      }),
      title: c.full_name,
      colorState: resolved ? "resolved" : "upcoming",
      scriptUrl,
      status: c.status,
      outcome: c.outcome,
      clientEmail: c.email,
      clientPhone: c.phone,
      meetingHref: meetingUrl ?? undefined,
      clientHref: clientIdByEmail.has(c.email) ? `/portal/admin/clients/${clientIdByEmail.get(c.email)}` : undefined,
      subject: c.subject ?? undefined,
      notes: c.notes ?? undefined,
    });
  }

  for (const s of (sessions ?? []) as Record<string, any>[]) {
    const client = s.clients as { full_name: string | null; email: string; phone: string | null } | null;
    const startDate = new Date(s.scheduled_at);
    const resolved =
      ["completed", "cancelled_by_client", "cancelled_by_tutor"].includes(s.status) ||
      startDate.getTime() < now.getTime();
    const label = client?.full_name || client?.email || "Client";
    push(dateKeyFor(startDate), {
      id: s.id,
      kind: "session",
      startIso: startDate.toISOString(),
      timeLabel: startDate.toLocaleTimeString("en-US", {
        timeZone: TUTOR_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
      }),
      title:
        s.status === "pending_payment" ? `${label} (${s.duration_minutes} min) — unpaid` : `${label} (${s.duration_minutes} min)`,
      colorState: resolved ? "resolved" : "upcoming",
      payment: sessionPaymentLabel(s),
      status: s.status,
      clientEmail: client?.email,
      clientPhone: client?.phone ?? undefined,
      roomHref: `/portal/session/${s.id}`,
      clientHref: `/portal/admin/clients/${s.client_id}`,
    });
  }

  const timeOffRows = (timeOff ?? []) as {
    id: string;
    starts_at: string;
    ends_at: string;
    reason: string | null;
  }[];

  const days: CalendarDay[] = dayMeta.map((meta, i) => {
    const dayStart = boundaries[i];
    const dayEnd = boundaries[i + 1];
    const off = timeOffRows.find(
      (t) => new Date(t.starts_at).getTime() < dayEnd.getTime() && new Date(t.ends_at).getTime() > dayStart.getTime()
    );
    return {
      ...meta,
      isToday: meta.dateKey === dateKeyFor(now),
      isOff: Boolean(off),
      offReason: off?.reason ?? undefined,
      entries: (entriesByDate.get(meta.dateKey) ?? []).sort(
        (a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()
      ),
    };
  });

  return (
    <div className="portal-shell wrap">
      <AdminTabs />
      <div className="section-head">
        <h2>Calendar</h2>
        <p>Click a day to see what&apos;s on it, then click a booking to manage it.</p>
      </div>

      <AdminCalendarGrid
        days={days}
        rangeLabel={rangeLabel}
        prevHref={`/portal/admin/calendar?start=${prevKey}`}
        nextHref={`/portal/admin/calendar?start=${nextKey}`}
        todayHref="/portal/admin/calendar"
        isTodayWindow={windowStartKey === mondayKey}
        todayKey={todayKey}
      />

      <div className="time-off-panel">
        <div className="section-head sub">
          <h3>Time off</h3>
          <p>Block a day (or stretch of days) off your own schedule. Doesn&apos;t touch anything already booked.</p>
        </div>

        <form
          action={`/api/time-off?next=${encodeURIComponent(`/portal/admin/calendar?start=${windowStartKey}`)}`}
          method="post"
          className="time-off-form"
        >
          <div className="field">
            <label htmlFor="startDate">From</label>
            <input id="startDate" name="startDate" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="endDate">Through</label>
            <input id="endDate" name="endDate" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="reason">Reason (optional)</label>
            <input id="reason" name="reason" type="text" placeholder="e.g. vacation" />
          </div>
          <button className="btn btn-auto" type="submit">
            Block this time
          </button>
        </form>

        {timeOffRows.length > 0 && (
          <ul className="time-off-list">
            {timeOffRows.map((t) => (
              <li key={t.id}>
                <span>
                  {new Date(t.starts_at).toLocaleDateString("en-US", {
                    timeZone: TUTOR_TIMEZONE,
                    month: "short",
                    day: "numeric",
                  })}
                  {" – "}
                  {new Date(new Date(t.ends_at).getTime() - 1).toLocaleDateString("en-US", {
                    timeZone: TUTOR_TIMEZONE,
                    month: "short",
                    day: "numeric",
                  })}
                  {t.reason ? ` · ${t.reason}` : ""}
                </span>
                <form
                  action={`/api/time-off/${t.id}/delete?next=${encodeURIComponent(
                    `/portal/admin/calendar?start=${windowStartKey}`
                  )}`}
                  method="post"
                >
                  <button className="cal-close-btn" type="submit">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
