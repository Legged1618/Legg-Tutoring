import type { SupabaseClient } from "@supabase/supabase-js";
import { formatShort } from "@/lib/format";

export type MessageSender = "client" | "tutor";

export type ThreadMessage = {
  id: string;
  sender: MessageSender;
  body: string;
  createdAt: string;
  readAt: string | null;
  /** e.g. "Oct 6, 3:00 PM session", when the message is about one booking */
  sessionLabel: string | null;
};

export const MAX_MESSAGE_LENGTH = 5000;

/** One client's whole conversation with the tutor, oldest first. */
export async function fetchThread(admin: SupabaseClient, clientId: string): Promise<ThreadMessage[]> {
  const { data } = await admin
    .from("messages")
    .select("id, sender, body, created_at, read_at, sessions(scheduled_at)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as Record<string, any>[]).map((m) => {
    const session = m.sessions as { scheduled_at: string } | null;
    return {
      id: m.id,
      sender: m.sender,
      body: m.body,
      createdAt: m.created_at,
      readAt: m.read_at,
      sessionLabel: session ? `${formatShort(new Date(session.scheduled_at))} session` : null,
    };
  });
}

/** Marks everything the other side sent as read, once this side has seen it. */
export async function markThreadRead(admin: SupabaseClient, clientId: string, readBy: MessageSender) {
  await admin
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("client_id", clientId)
    .eq("sender", readBy === "tutor" ? "client" : "tutor")
    .is("read_at", null);
}
