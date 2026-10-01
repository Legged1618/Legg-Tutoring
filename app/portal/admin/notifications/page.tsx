import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";
import { formatShort, formatWhen } from "@/lib/format";

const LOOKBACK_DAYS = 30;

type Activity = {
  id: string;
  at: string;
  summary: string;
  detail: string;
  href?: string;
};

function feeNote(s: Record<string, any>): string {
  if (!s.amount_paid_cents) return "wasn't paid, nothing to refund";
  const fee = s.amount_paid_cents - s.refund_cents;
  return fee > 0
    ? `$${(fee / 100).toFixed(2)} cancellation fee applied`
    : "no cancellation fee, refunded in full";
}

export default async function AdminNotificationsPage() {
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

  const admin = createAdminClient();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toISOString();

  const [{ data: consultations }, { data: sessions }, { data: messages }] = await Promise.all([
    admin
      .from("consultations")
      .select("id, full_name, email, scheduled_at, created_at")
      .gte("created_at", since),
    admin
      .from("sessions")
      .select("id, scheduled_at, duration_minutes, status, created_at, cancelled_at, amount_paid_cents, refund_cents, client_id, clients(full_name, email)")
      .gte("created_at", since)
      .neq("status", "pending_payment"),
    admin
      .from("messages")
      .select("id, client_id, body, created_at, clients(full_name, email)")
      .eq("sender", "client")
      .gte("created_at", since),
  ]);

  const activity: Activity[] = [];

  for (const c of (consultations ?? []) as Record<string, any>[]) {
    activity.push({
      id: `consultation-new-${c.id}`,
      at: c.created_at,
      summary: `New consultation booked: ${c.full_name}`,
      detail: `${c.email} · scheduled for ${formatWhen(new Date(c.scheduled_at))}`,
    });
  }

  for (const s of (sessions ?? []) as Record<string, any>[]) {
    const client = s.clients as { full_name: string | null; email: string } | null;
    const label = client?.full_name || client?.email || "Client";

    activity.push({
      id: `session-new-${s.id}`,
      at: s.created_at,
      summary: `New paid session booked: ${label}`,
      detail: `${s.duration_minutes} min · scheduled for ${formatWhen(new Date(s.scheduled_at))}`,
      href: `/portal/admin/clients/${s.client_id}`,
    });

    if (s.cancelled_at) {
      activity.push({
        id: `session-cancelled-${s.id}`,
        at: s.cancelled_at,
        summary: `Session cancelled: ${label}`,
        detail: `Was scheduled for ${formatWhen(new Date(s.scheduled_at))} · ${s.status.replaceAll("_", " ")} · ${feeNote(s)}`,
        href: `/portal/admin/clients/${s.client_id}`,
      });
    }
  }

  for (const m of (messages ?? []) as Record<string, any>[]) {
    const client = m.clients as { full_name: string | null; email: string } | null;
    activity.push({
      id: `message-${m.id}`,
      at: m.created_at,
      summary: `New message: ${client?.full_name || client?.email || "Client"}`,
      detail: m.body.length > 120 ? `${m.body.slice(0, 120)}...` : m.body,
      href: `/portal/admin/clients/${m.client_id}#messages`,
    });
  }

  activity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className="portal-shell wrap">
      <AdminTabs />
      <div className="section-head">
        <h2>Notifications</h2>
        <p>
          Booking activity from the last {LOOKBACK_DAYS} days.
        </p>
      </div>

      <div className="session-list">
        {activity.length === 0 && <p className="notice">Nothing in the last {LOOKBACK_DAYS} days.</p>}
        {activity.map((a) => (
          <div className="session-row" key={a.id}>
            <div>
              <strong>{a.href ? <Link href={a.href}>{a.summary}</Link> : a.summary}</strong>
              <div className="meta">{a.detail}</div>
            </div>
            <div className="meta">
              {formatShort(new Date(a.at))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
