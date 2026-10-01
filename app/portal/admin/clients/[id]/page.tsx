import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";
import MessageThread from "@/components/MessageThread";
import { fetchThread, markThreadRead } from "@/lib/messages";
import { formatDate, formatWhen, sessionPaymentLabel } from "@/lib/format";

export default async function AdminClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  const isTutor = Boolean(process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL);
  if (!isTutor) {
    return (
      <div className="portal-shell wrap">
        <p className="notice error">This page is only for the tutor account.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("*").eq("id", id).maybeSingle();
  if (!client) {
    notFound();
  }

  const [{ data: sessions }, { data: consultations }, messages] = await Promise.all([
    admin
      .from("sessions")
      .select("*")
      .eq("client_id", client.id)
      .order("scheduled_at", { ascending: false }),
    admin
      .from("consultations")
      .select("*")
      .eq("email", client.email)
      .order("scheduled_at", { ascending: false }),
    fetchThread(admin, client.id),
  ]);
  await markThreadRead(admin, client.id, "tutor");

  const now = Date.now();
  const allSessions = (sessions ?? []) as Record<string, any>[];
  const upcoming = allSessions
    .filter((s) => ["scheduled", "pending_payment"].includes(s.status) && new Date(s.scheduled_at).getTime() >= now)
    .reverse();
  const past = allSessions.filter((s) => !upcoming.includes(s));
  const selfHref = `/portal/admin/clients/${client.id}`;

  return (
    <div className="portal-shell wrap">
      <AdminTabs />
      <p style={{ maxWidth: 720, margin: "0 auto 12px" }}>
        <Link href="/portal/admin/clients" className="cal-today-link">
          &larr; All clients
        </Link>
      </p>

      <div className="session-row client-summary">
        <div>
          <h2 style={{ fontSize: "1.5rem" }}>{client.full_name || "(no name on file)"}</h2>
          <div className="meta">
            <a href={`mailto:${client.email}`}>{client.email}</a>
            {client.phone ? (
              <>
                {" · "}
                <a href={`tel:${client.phone}`}>{client.phone}</a>
              </>
            ) : null}
          </div>
          <div className="meta">
            Signed up {formatDate(new Date(client.created_at))}
            {client.auth_user_id ? "" : " · never logged in"}
            {" · "}
            {client.approved ? "Approved to book sessions" : "Not approved to book sessions"}
          </div>
        </div>
        <form action={`/api/clients/${client.id}/approval?next=${encodeURIComponent(selfHref)}`} method="post">
          <input type="hidden" name="approved" value={client.approved ? "false" : "true"} />
          <button className={client.approved ? "btn btn-secondary" : "btn"} type="submit" style={{ width: "auto" }}>
            {client.approved ? "Revoke" : "Approve"}
          </button>
        </form>
      </div>

      <div className="client-columns">
        <section id="notes" className="portal-card client-notes">
          <h3>Your notes</h3>
          <p className="meta">Private. Only you see these.</p>
          <form action={`/api/clients/${client.id}/notes`} method="post">
            <textarea
              name="notes"
              rows={8}
              defaultValue={client.tutor_notes ?? ""}
              placeholder="Topics covered, where they're struggling, what to try next..."
            />
            <button className="btn" type="submit" style={{ width: "auto" }}>
              Save notes
            </button>
            {saved === "notes" && <span className="saved-flag">Saved</span>}
          </form>
        </section>

        <section id="messages" className="portal-card">
          <h3>Messages</h3>
          <MessageThread
            messages={messages}
            viewer="tutor"
            action={`/api/clients/${client.id}/messages`}
            otherName={client.full_name || "Client"}
            emptyText="No messages yet."
          />
        </section>
      </div>

      <div className="section-head" style={{ marginTop: 40, marginBottom: 16 }}>
        <h3>Upcoming sessions ({upcoming.length})</h3>
      </div>
      <div className="session-list">
        {upcoming.length === 0 && <p className="notice">None booked.</p>}
        {upcoming.map((s) => (
          <div className="session-row" key={s.id}>
            <div>
              <strong>{formatWhen(new Date(s.scheduled_at))}</strong>
              <div className="meta">
                {s.duration_minutes} min &middot; {sessionPaymentLabel(s)}
              </div>
            </div>
            {s.status === "scheduled" && (
              <Link href={`/portal/session/${s.id}`} className="btn" style={{ width: "auto" }}>
                Open room
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 40, marginBottom: 16 }}>
        <h3>Past and cancelled sessions ({past.length})</h3>
      </div>
      <div className="session-list">
        {past.length === 0 && <p className="notice">None yet.</p>}
        {past.map((s) => (
          <div className="session-row resolved" key={s.id}>
            <div>
              <strong>{formatWhen(new Date(s.scheduled_at))}</strong>
              <div className="meta">
                {s.duration_minutes} min &middot; {s.status.replaceAll("_", " ")} &middot; {sessionPaymentLabel(s)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-head" style={{ marginTop: 40, marginBottom: 16 }}>
        <h3>Consultations ({(consultations ?? []).length})</h3>
      </div>
      <div className="session-list">
        {(consultations ?? []).length === 0 && <p className="notice">No consultation on file.</p>}
        {((consultations ?? []) as Record<string, any>[]).map((c) => (
          <div className="session-row" key={c.id}>
            <div>
              <strong>{formatWhen(new Date(c.scheduled_at))}</strong>
              <div className="meta">
                {c.status.replaceAll("_", " ")} &middot; outcome: {c.outcome.replaceAll("_", " ")}
              </div>
              {c.subject && <div className="meta">Subject: {c.subject}</div>}
              {c.notes && <div className="meta">Notes: {c.notes}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
