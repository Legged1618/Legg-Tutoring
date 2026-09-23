import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import PortalHeader from "@/components/PortalHeader";

export default async function PortalDashboard({
  searchParams,
}: {
  searchParams: Promise<{ booked?: string }>;
}) {
  const { booked } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);
  const approved = client.approved;
  const isTutor = Boolean(
    process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  const { data: sessions } = await admin
    .from("sessions")
    .select("*")
    .eq("client_id", client.id)
    .order("scheduled_at", { ascending: true });

  return (
    <>
      <PortalHeader />
      <div className="portal-shell wrap">
        {booked === "1" && (
          <p className="notice success" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
            Payment received &mdash; your session is booked!
          </p>
        )}

        <div className="section-head">
          <h2>Your sessions</h2>
          <p>{user.email}</p>
          {isTutor && (
            <p style={{ marginTop: 10 }}>
              <Link href="/portal/admin">Go to consultation admin &rarr;</Link>
            </p>
          )}
        </div>

        {!approved && (
          <p className="notice" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        )}

        {approved && (
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Link href="/portal/book" className="btn" style={{ maxWidth: 260, margin: "0 auto" }}>
              Book a session
            </Link>
          </div>
        )}

        <div className="session-list">
          {sessions && sessions.length > 0 ? (
            sessions.map((s: Record<string, any>) => (
              <div className="session-row" key={s.id}>
                <div>
                  <strong>
                    {s.type === "virtual" ? "Virtual session" : "In-person session"}
                  </strong>
                  <div className="meta">
                    {new Date(s.scheduled_at).toLocaleString()} &middot;{" "}
                    {s.duration_minutes} min
                    {s.location ? ` · ${s.location}` : ""}
                  </div>
                  <div className="meta">Status: {s.status.replaceAll("_", " ")}</div>
                </div>
                {(s.status === "scheduled" || s.status === "pending_payment") && (
                  <form action={`/api/sessions/${s.id}/cancel`} method="post">
                    <button className="btn btn-secondary" type="submit">
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <p className="notice">No sessions yet.</p>
          )}
        </div>

        <p className="policy-note">
          Cancel 24+ hours before your session for a full refund. Cancelling
          inside 24 hours applies a flat $10 fee to the refund. If your tutor
          cancels, you&apos;re refunded in full automatically.
        </p>
      </div>
    </>
  );
}
