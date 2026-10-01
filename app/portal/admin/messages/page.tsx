import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import AdminTabs from "@/components/AdminTabs";
import { formatShort } from "@/lib/format";

type Conversation = {
  clientId: string;
  name: string;
  lastBody: string;
  lastSender: string;
  lastAt: string;
  unread: number;
};

export default async function AdminMessagesPage() {
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
  const { data } = await admin
    .from("messages")
    .select("client_id, sender, body, created_at, read_at, clients(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(500);

  // Newest-first rows, so the first one seen per client is its latest.
  const byClient = new Map<string, Conversation>();
  for (const m of (data ?? []) as Record<string, any>[]) {
    const client = m.clients as { full_name: string | null; email: string } | null;
    let convo = byClient.get(m.client_id);
    if (!convo) {
      convo = {
        clientId: m.client_id,
        name: client?.full_name || client?.email || "Client",
        lastBody: m.body,
        lastSender: m.sender,
        lastAt: m.created_at,
        unread: 0,
      };
      byClient.set(m.client_id, convo);
    }
    if (m.sender === "client" && !m.read_at) convo.unread += 1;
  }
  const conversations = [...byClient.values()];

  return (
    <div className="portal-shell wrap">
      <AdminTabs />
      <div className="section-head">
        <h2>Messages</h2>
        <p>Every client conversation, newest first.</p>
      </div>

      <div className="session-list">
        {conversations.length === 0 && <p className="notice">No messages yet.</p>}
        {conversations.map((c) => (
          <Link
            href={`/portal/admin/clients/${c.clientId}#messages`}
            className={`session-row conversation-row${c.unread ? " unread" : ""}`}
            key={c.clientId}
          >
            <div style={{ minWidth: 0 }}>
              <strong>{c.name}</strong>
              {c.unread > 0 && <span className="unread-badge">{c.unread} new</span>}
              <div className="meta conversation-preview">
                {c.lastSender === "tutor" ? "You: " : ""}
                {c.lastBody}
              </div>
            </div>
            <div className="meta">{formatShort(new Date(c.lastAt))}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
