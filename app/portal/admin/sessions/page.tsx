import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";
import { formatWhen, sessionPaymentLabel } from "@/lib/format";
import StatusPill from "@/components/StatusPill";

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
        <div className="portal-shell wrap">
          <p className="notice error">This page is only for the tutor account.</p>
        </div>
      </>
    );
  }

  const admin = createAdminClient();
  const { data: upcoming } = await admin
    .from("sessions")
    .select("*, clients(full_name, email, phone)")
    .in("status", ["scheduled", "pending_payment"])
    .order("scheduled_at", { ascending: true });

  return (
    <>
      <div className="portal-shell wrap">
        <AdminTabs />
        <div className="section-head">
          <h2>All sessions</h2>
          <p>Every client&apos;s paid sessions, across the whole client list.</p>
        </div>

        <div className="session-list">
          {(upcoming ?? []).length === 0 && <p className="empty-state">No upcoming sessions.</p>}
          {(upcoming ?? []).map((s: Record<string, any>) => {
            const client = s.clients as {
              full_name: string | null;
              email: string;
              phone: string | null;
            } | null;
            return (
              <div className="session-row" key={s.id}>
                <div>
                  <strong>
                    <Link href={`/portal/admin/clients/${s.client_id}`}>
                      {client?.full_name || client?.email || "Client"}
                    </Link>
                  </strong>
                  <div className="meta">
                    {formatWhen(new Date(s.scheduled_at))} &middot;{" "}
                    {s.duration_minutes} min &middot; ${(s.rate_cents / 100).toFixed(2)}
                  </div>
                  <div className="meta">
                    {client?.email}
                    {client?.phone ? ` · ${client.phone}` : ""}
                  </div>
                  <div className="row-pills">
                    <StatusPill value={s.status} />
                    <span className={`status-pill ${s.status === "pending_payment" ? "brass" : "teal"}`}>
                      {sessionPaymentLabel(s)}
                    </span>
                  </div>
                </div>
                <div className="row-actions">
                  {s.status === "scheduled" && (
                    <Link href={`/portal/session/${s.id}`} className="btn btn-auto btn-sm">
                      Open room
                    </Link>
                  )}
                  <form action={`/api/sessions/${s.id}/cancel`} method="post">
                    <button className="btn btn-danger btn-auto btn-sm" type="submit">
                      Cancel
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
