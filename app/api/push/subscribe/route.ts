import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isTutorRequest } from "@/lib/tutorAuth";

type SubscriptionBody = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

// Registers this browser for the tutor's desktop alerts.
export async function POST(request: Request) {
  if (!(await isTutorRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const sub = (await request.json().catch(() => ({}))) as SubscriptionBody;
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
    { onConflict: "endpoint" }
  );
  if (error) {
    return NextResponse.json({ error: "Could not save this device." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Turns alerts off for this browser.
export async function DELETE(request: Request) {
  if (!(await isTutorRequest())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const { endpoint } = (await request.json().catch(() => ({}))) as { endpoint?: string };
  if (endpoint) {
    await createAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
  return NextResponse.json({ ok: true });
}
