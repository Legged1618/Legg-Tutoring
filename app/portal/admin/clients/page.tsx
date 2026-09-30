import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminClientsPage() {
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
  const { data: clients } = await admin
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="portal-shell wrap">
      <AdminTabs />
      <div className="section-head">
        <h2>Manage clients</h2>
        <p>Everyone who&apos;s ever logged in or booked a consultation -- a directory, not an action list.</p>
      </div>

      <div className="session-list">
        {(clients ?? []).length === 0 && <p className="notice">No one yet.</p>}
        {(clients ?? []).map((c: Record<string, any>) => (
          <div className="session-row" key={c.id}>
            <div>
              <strong>{c.full_name || "(no name on file)"}</strong>
              <div className="meta">
                {c.email}
                {c.phone ? ` · ${c.phone}` : ""}
              </div>
              <div className="meta">
                Signed up {new Date(c.created_at).toLocaleDateString()}
                {c.auth_user_id ? "" : " · never logged in"}
              </div>
            </div>
            <div className="meta">{c.approved ? "Approved" : "Not approved"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
