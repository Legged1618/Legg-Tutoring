import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";
import AdminTabs from "@/components/AdminTabs";
import AdminCalendarGrid, { type CalendarDay, type CalendarEntry } from "@/components/AdminCalendarGrid";
import { buildConsultationChecklist, buildSessionChecklist } from "@/lib/bookingChecklist";
import { TUTOR_TIMEZONE, zonedWallTimeToUtc, shiftDateKey } from "@/lib/availability";

const WINDOW_DAYS = 30;

function todayKeyInTutorTz(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TUTOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

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
      <>
        <PortalHeader />
        <div className="portal-shell wrap">
          <p className="notice error">This page is only for the tutor account.</p>
        </div>
      </>
    );
  }

  const now = new Date();
  const todayKey = todayKeyInTutorTz(now);
  const windowStartKey = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : todayKey;

  // 31 boundaries -> 30 day buckets, each the real UTC instant of local
  // midnight for that day (so DST transitions inside the window are exact,
  // not just "+24h" guesses).
  const boundaries: Date[] = [];
  const dayMeta: { dateKey: string; dayNumber: number; weekdayLabel: string; monthLabel: string }[] = [];
  const [startY, startM, startD] = windowStartKey.split("-").map(Number);
  for (let i = 0; i <= WINDOW_DAYS; i++) {
    const anchor = new Date(Date.UTC(startY, startM - 1, startD + i));
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth() + 1;
    const d = anchor.getUTCDate();
    boundaries.push(zonedWallTimeToUtc(y, m, d, 0, 0, TUTOR_TIMEZONE));
    if (i < WINDOW_DAYS) {
      const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dayMeta.push({
        dateKey,
        dayNumber: d,
        weekdayLabel: boundaries[i].toLocaleDateString("en-US", {
          timeZone: TUTOR_TIMEZONE,
          weekday: "short",
        }),
        monthLabel: boundaries[i].toLocaleDateString("en-US", {
          timeZone: TUTOR_TIMEZONE,
          month: "short",
        }),
      });
    }
  }

  const rangeStart = boundaries[0].toISOString();
  const rangeEnd = boundaries[WINDOW_DAYS].toISOString();
  const scriptUrl = process.env.CALL_SCRIPT_URL;

  const admin = createAdminClient();
  const [{ data: consultations }, { data: sessions }, { data: timeOff }] = await Promise.all([
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
  ]);

  const entriesByDate = new Map<string, CalendarEntry[]>();

  function dateKeyFor(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TUTOR_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  }

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
      checklist: buildConsultationChecklist(c as any, scriptUrl),
      scriptUrl,
      status: c.status,
      outcome: c.outcome,
      clientEmail: c.email,
      clientPhone: c.phone,
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
      checklist: buildSessionChecklist(s as any, client),
      status: s.status,
      clientEmail: client?.email,
      clientPhone: client?.phone ?? undefined,
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
      isToday: meta.dateKey === todayKey,
      isOff: Boolean(off),
      offReason: off?.reason ?? undefined,
      entries: (entriesByDate.get(meta.dateKey) ?? []).sort(
        (a, b) => new Date(a.startIso).getTime() - new Date(b.startIso).getTime()
      ),
    };
  });

  const rangeLabel = `${boundaries[0].toLocaleDateString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    month: "short",
    day: "numeric",
  })} – ${boundaries[WINDOW_DAYS - 1].toLocaleDateString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap">
        <AdminTabs />
        <div className="section-head">
          <h2>Calendar</h2>
          <p>Click a day to see what&apos;s on it, then click a booking to manage it.</p>
        </div>

        <AdminCalendarGrid
          days={days}
          rangeLabel={rangeLabel}
          prevHref={`/portal/admin/calendar?start=${shiftDateKey(windowStartKey, -WINDOW_DAYS)}`}
          nextHref={`/portal/admin/calendar?start=${shiftDateKey(windowStartKey, WINDOW_DAYS)}`}
          todayHref="/portal/admin/calendar"
          isTodayWindow={windowStartKey === todayKey}
        />

        <div className="time-off-panel">
          <div className="section-head" style={{ marginBottom: 16 }}>
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
            <button className="btn" type="submit" style={{ width: "auto" }}>
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
    </>
  );
}
