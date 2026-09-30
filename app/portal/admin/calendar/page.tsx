import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";
import AdminTabs from "@/components/AdminTabs";
import AdminCalendarItem from "@/components/AdminCalendarItem";
import { buildConsultationChecklist, buildSessionChecklist } from "@/lib/bookingChecklist";
import { TUTOR_TIMEZONE } from "@/lib/availability";

const LOOKAHEAD_DAYS = 30;

type AgendaEntry = {
  id: string;
  type: "consultation" | "session";
  start: Date;
  title: string;
  checklist: string;
};

export default async function AdminCalendarPage() {
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

  const admin = createAdminClient();
  const now = new Date();
  const rangeEnd = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400000).toISOString();
  const scriptUrl = process.env.CALL_SCRIPT_URL;

  const [{ data: consultations }, { data: sessions }] = await Promise.all([
    admin
      .from("consultations")
      .select("*")
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", rangeEnd),
    admin
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .in("status", ["scheduled", "pending_payment"])
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", rangeEnd),
  ]);

  const entries: AgendaEntry[] = [];

  for (const c of (consultations ?? []) as Record<string, any>[]) {
    entries.push({
      id: `consultation-${c.id}`,
      type: "consultation",
      start: new Date(c.scheduled_at),
      title: `Consultation with ${c.full_name}`,
      checklist: buildConsultationChecklist(c as any, scriptUrl),
    });
  }

  for (const s of (sessions ?? []) as Record<string, any>[]) {
    const client = s.clients as { full_name: string | null; email: string; phone: string | null } | null;
    const label = client?.full_name || client?.email || "Client";
    entries.push({
      id: `session-${s.id}`,
      type: "session",
      start: new Date(s.scheduled_at),
      title:
        s.status === "pending_payment"
          ? `${label} (${s.duration_minutes} min) — awaiting payment`
          : `${label} (${s.duration_minutes} min)`,
      checklist: buildSessionChecklist(s as any, client),
    });
  }

  entries.sort((a, b) => a.start.getTime() - b.start.getTime());

  const groups = new Map<string, AgendaEntry[]>();
  for (const entry of entries) {
    const key = entry.start.toLocaleDateString("en-US", {
      timeZone: TUTOR_TIMEZONE,
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap">
        <AdminTabs />
        <div className="section-head">
          <h2>Calendar</h2>
          <p>Next {LOOKAHEAD_DAYS} days. Click anything to see what to do.</p>
        </div>

        {entries.length === 0 && <p className="notice">Nothing coming up.</p>}

        {Array.from(groups.entries()).map(([day, dayEntries]) => (
          <div className="calendar-day-group" key={day}>
            <h4>{day}</h4>
            {dayEntries.map((entry) => (
              <AdminCalendarItem
                key={entry.id}
                type={entry.type}
                time={entry.start.toLocaleTimeString("en-US", {
                  timeZone: TUTOR_TIMEZONE,
                  hour: "numeric",
                  minute: "2-digit",
                })}
                title={entry.title}
                checklist={entry.checklist}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
