import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";
import { formatDate } from "@/lib/format";

function ClientRow({ c }: { c: Record<string, any> }) {
  return (
    <div className="session-row">
      <div>
        <strong>
          <Link href={`/portal/admin/clients/${c.id}`}>{c.full_name || "(no name on file)"}</Link>
        </strong>
        <div className="meta">
          {c.email}
          {c.phone ? ` · ${c.phone}` : ""}
        </div>
        <div className="meta">
          Signed up {formatDate(new Date(c.created_at))}
          {c.auth_user_id ? "" : " · never logged in"}
        </div>
      </div>
      <form action={`/api/clients/${c.id}/approval`} method="post">
        <input type="hidden" name="approved" value={c.approved ? "false" : "true"} />
        <button
          className={c.approved ? "btn btn-secondary btn-auto btn-sm" : "btn btn-auto btn-sm"}
          type="submit"
        >
          {c.approved ? "Revoke" : "Approve"}
        </button>
      </form>
    </div>
  );
}

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
  const [{ data: clients }, { data: consultations }] = await Promise.all([
    admin.from("clients").select("*").order("created_at", { ascending: false }),
    admin.from("consultations").select("email"),
  ]);

  const consultationEmails = new Set(
    ((consultations ?? []) as { email: string }[]).map((c) => c.email)
  );

  const rows = ((clients ?? []) as Record<string, any>[]).filter(
    (c) => c.email !== process.env.TUTOR_EMAIL
  );

  const approved = rows.filter((c) => c.approved);
  const bookedNotApproved = rows.filter((c) => !c.approved && consultationEmails.has(c.email));
  const signedUpOnly = rows.filter((c) => !c.approved && !consultationEmails.has(c.email));

  return (
    <div className="portal-shell wrap">
      <AdminTabs />
      <div className="section-head">
        <h2>Manage clients</h2>
        <p>Everyone who&apos;s ever logged in or booked a consultation, sorted by where they stand.</p>
      </div>

      <div className="section-head sub">
        <h3>Approved for the client portal ({approved.length})</h3>
      </div>
      <div className="session-list">
        {approved.length === 0 && <p className="empty-state">No one yet.</p>}
        {approved.map((c) => (
          <ClientRow c={c} key={c.id} />
        ))}
      </div>

      <div className="section-head sub">
        <h3>Booked a consultation, not yet approved ({bookedNotApproved.length})</h3>
      </div>
      <div className="session-list">
        {bookedNotApproved.length === 0 && <p className="empty-state">No one yet.</p>}
        {bookedNotApproved.map((c) => (
          <ClientRow c={c} key={c.id} />
        ))}
      </div>

      <div className="section-head sub">
        <h3>Signed up only, no consultation on file ({signedUpOnly.length})</h3>
      </div>
      <div className="session-list">
        {signedUpOnly.length === 0 && <p className="empty-state">No one yet.</p>}
        {signedUpOnly.map((c) => (
          <ClientRow c={c} key={c.id} />
        ))}
      </div>
    </div>
  );
}
