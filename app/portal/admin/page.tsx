import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function AdminPage() {
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
  const { data: consultations } = await admin
    .from("consultations")
    .select("*")
    .order("scheduled_at", { ascending: true });

  const pending = (consultations ?? []).filter(
    (c: Record<string, any>) => c.outcome === "pending"
  );
  const decided = (consultations ?? []).filter(
    (c: Record<string, any>) => c.outcome !== "pending"
  );

  return (
    <div className="portal-shell wrap">
      <div className="section-head">
        <h2>Consultations</h2>
        <p>
          Everyone is auto-approved for portal access when they book. Mark
          &quot;Not a fit&quot; after a call to revoke that.
        </p>
      </div>

      <div className="session-list">
        {pending.length === 0 && <p className="notice">Nothing pending.</p>}
        {pending.map((c: Record<string, any>) => (
          <div className="session-row" key={c.id}>
            <div>
              <strong>{c.full_name}</strong>
              <div className="meta">
                {new Date(c.scheduled_at).toLocaleString()} &middot; {c.email}
                {c.phone ? ` · ${c.phone}` : ""}
              </div>
              {c.subject && <div className="meta">Subject: {c.subject}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <form action={`/api/consultations/${c.id}/outcome`} method="post">
                <input type="hidden" name="outcome" value="good_fit" />
                <button className="btn" type="submit" style={{ width: "auto" }}>
                  Good fit
                </button>
              </form>
              <form action={`/api/consultations/${c.id}/outcome`} method="post">
                <input type="hidden" name="outcome" value="not_a_fit" />
                <button className="btn btn-secondary" type="submit" style={{ width: "auto" }}>
                  Not a fit
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 48 }}>
        <h2>Past consultations</h2>
      </div>
      <div className="session-list">
        {decided.map((c: Record<string, any>) => (
          <div className="session-row" key={c.id}>
            <div>
              <strong>{c.full_name}</strong>
              <div className="meta">
                {new Date(c.scheduled_at).toLocaleString()} &middot; {c.email}
              </div>
            </div>
            <div className="meta">{c.outcome.replaceAll("_", " ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
