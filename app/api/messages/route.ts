import { NextResponse, after } from "next/server";
import { notifyTutor } from "@/lib/push";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { MAX_MESSAGE_LENGTH } from "@/lib/messages";
import { safeNext } from "@/lib/safeNext";

// A client sending the tutor a message, either a general question or one
// about a specific booking of theirs.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const formData = await request.formData();
  const body = String(formData.get("body") || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  const sessionId = String(formData.get("sessionId") || "") || null;
  const next = safeNext(new URL(request.url).searchParams.get("next"), "/portal/messages");

  if (!body) {
    return NextResponse.redirect(new URL(next, request.url), { status: 303 });
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);

  // Only tag the message with a booking that belongs to this client.
  let ownedSessionId: string | null = null;
  if (sessionId) {
    const { data: session } = await admin
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("client_id", client.id)
      .maybeSingle();
    ownedSessionId = session?.id ?? null;
  }

  await admin.from("messages").insert({
    client_id: client.id,
    session_id: ownedSessionId,
    sender: "client",
    body,
  });

  after(() =>
    notifyTutor({
      title: `Message from ${client.full_name || client.email}`,
      body: body.length > 140 ? `${body.slice(0, 140)}...` : body,
      url: `/portal/admin/clients/${client.id}#messages`,
      tag: `message-${client.id}`,
    })
  );

  return NextResponse.redirect(new URL(next, request.url), { status: 303 });
}
