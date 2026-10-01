import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { fetchThread, markThreadRead } from "@/lib/messages";
import { formatShort } from "@/lib/format";
import { TUTOR_NAME } from "@/lib/tutor";
import MessageThread from "@/components/MessageThread";
import LiveRefresh from "@/components/LiveRefresh";

export default async function ClientMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/portal/login");
  }

  if (process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL) {
    redirect("/portal/admin/messages");
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);

  const [messages, { data: sessions }] = await Promise.all([
    fetchThread(admin, client.id),
    admin
      .from("sessions")
      .select("id, scheduled_at, duration_minutes, status")
      .eq("client_id", client.id)
      .in("status", ["scheduled", "completed"])
      .order("scheduled_at", { ascending: false })
      .limit(20),
  ]);
  await markThreadRead(admin, client.id, "client");

  const sessionOptions = ((sessions ?? []) as Record<string, any>[]).map((s) => ({
    id: s.id as string,
    label: `${formatShort(new Date(s.scheduled_at))} session (${s.duration_minutes} min)`,
  }));
  const defaultSessionId = sessionOptions.some((s) => s.id === sessionParam) ? sessionParam : undefined;

  return (
    <div className="portal-shell wrap">
      <LiveRefresh seconds={10} />
      <div className="section-head">
        <h2>Messages</h2>
        <p>Questions about a session, or anything else. {TUTOR_NAME} will reply here.</p>
      </div>
      <MessageThread
        messages={messages}
        viewer="client"
        action="/api/messages"
        otherName={TUTOR_NAME}
        sessionOptions={sessionOptions}
        defaultSessionId={defaultSessionId}
        emptyText="No messages yet. Ask anything below."
      />
    </div>
  );
}
