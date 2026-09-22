import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { buildIcsFeed, type IcsEvent } from "@/lib/ics";

const CONSULTATION_MINUTES = 15;
const FEED_LOOKBACK_DAYS = 1;
const FEED_LOOKAHEAD_DAYS = 90;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!process.env.CALENDAR_FEED_TOKEN || token !== process.env.CALENDAR_FEED_TOKEN) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const rangeStart = new Date(now.getTime() - FEED_LOOKBACK_DAYS * 86400000).toISOString();
  const rangeEnd = new Date(now.getTime() + FEED_LOOKAHEAD_DAYS * 86400000).toISOString();
  const scriptUrl = process.env.CALL_SCRIPT_URL;

  const [{ data: consultations }, { data: sessions }] = await Promise.all([
    admin
      .from("consultations")
      .select("*")
      .eq("status", "scheduled")
      .gte("scheduled_at", rangeStart)
      .lte("scheduled_at", rangeEnd),
    admin
      .from("sessions")
      .select("*, clients(full_name, email, phone)")
      .eq("status", "scheduled")
      .gte("scheduled_at", rangeStart)
      .lte("scheduled_at", rangeEnd),
  ]);

  const events: IcsEvent[] = [];

  for (const c of (consultations ?? []) as Record<string, any>[]) {
    const start = new Date(c.scheduled_at);
    const end = new Date(start.getTime() + CONSULTATION_MINUTES * 60000);
    events.push({
      uid: `consultation-${c.id}@leggtutoring.com`,
      start,
      end,
      summary: `Consultation: ${c.full_name}`,
      description: [
        `Email: ${c.email}`,
        c.phone ? `Phone: ${c.phone}` : null,
        c.subject ? `Subject: ${c.subject}` : null,
        c.notes ? `Notes: ${c.notes}` : null,
        scriptUrl ? `Call script: ${scriptUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  for (const s of (sessions ?? []) as Record<string, any>[]) {
    const start = new Date(s.scheduled_at);
    const end = new Date(start.getTime() + s.duration_minutes * 60000);
    const client = s.clients as { full_name: string | null; email: string; phone: string | null } | null;
    const label = s.type === "virtual" ? "Virtual session" : "In-person session";
    events.push({
      uid: `session-${s.id}@leggtutoring.com`,
      start,
      end,
      summary: `${label}: ${client?.full_name || client?.email || "Client"}`,
      description: [
        client?.email ? `Email: ${client.email}` : null,
        client?.phone ? `Phone: ${client.phone}` : null,
        `Rate: $${(s.rate_cents / 100).toFixed(2)}`,
      ]
        .filter(Boolean)
        .join("\n"),
      location: s.location || undefined,
    });
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());

  const ics = buildIcsFeed("Legg Tutoring Bookings", events);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, no-cache, max-age=0",
    },
  });
}
