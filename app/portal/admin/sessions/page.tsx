import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import PortalHeader from "@/components/PortalHeader";

export default async function AdminSessionsPage() {
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
  const { data: sessions } = await admin
    .from("sessions")
    .select("*, clients(full_name, email, phone)")
    .order("scheduled_at", { ascending: true });

  const upcoming = (sessions ?? []).filter((s: Record<string, any>) =>
    ["scheduled", "pending_payment"].includes(s.status)
  );
  const past = (sessions ?? []).filter(
    (s: Record<string, any>) => !["scheduled", "pending_payment"].includes(s.status)
  );

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap">
      <div className="section-head">
        <h2>All sessions</h2>
        <p>Every client's paid sessions, across the whole client list.</p>
        <p style={{ marginTop: 10 }}>
          <Link href="/portal/admin">&larr; Back to consultations</Link>
        </p>
      </div>

      <div className="session-list">
        {upcoming.length === 0 && <p className="notice">No upcoming sessions.</p>}
        {upcoming.map((s: Record<string, any>) => {
          const client = s.clients as {
            full_name: string | null;
            email: string;
            phone: string | null;
          } | null;
          return (
            <div className="session-row" key={s.id}>
              <div>
                <strong>{client?.full_name || client?.email || "Client"}</strong>
                <div className="meta">
                  {new Date(s.scheduled_at).toLocaleString()} &middot;{" "}
                  {s.duration_minutes} min &middot; ${(s.rate_cents / 100).toFixed(2)}
                </div>
                <div className="meta">
                  {client?.email}
                  {client?.phone ? ` · ${client.phone}` : ""}
                </div>
                <div className="meta">Status: {s.status.replaceAll("_", " ")}</div>
              </div>
              <form action={`/api/sessions/${s.id}/cancel`} method="post">
                <button className="btn btn-secondary" type="submit">
                  Cancel
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <div className="section-head" style={{ marginTop: 48 }}>
        <h2>Past / cancelled sessions</h2>
      </div>
      <div className="session-list">
        {past.length === 0 && <p className="notice">Nothing yet.</p>}
        {past.map((s: Record<string, any>) => {
          const client = s.clients as { full_name: string | null; email: string } | null;
          return (
            <div className="session-row" key={s.id}>
              <div>
                <strong>{client?.full_name || client?.email || "Client"}</strong>
                <div className="meta">
                  {new Date(s.scheduled_at).toLocaleString()} &middot; $
                  {(s.rate_cents / 100).toFixed(2)}
                  {s.refund_cents > 0 ? ` · $${(s.refund_cents / 100).toFixed(2)} refunded` : ""}
                </div>
              </div>
              <div className="meta">{s.status.replaceAll("_", " ")}</div>
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
}
