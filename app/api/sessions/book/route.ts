import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { stripe } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";
import {
  BOOKING_WINDOW_DAYS,
  SESSION_DURATIONS_MINUTES,
  isSlotStillAvailable,
} from "@/lib/availability";
import { fetchBusyIntervals } from "@/lib/busyIntervals";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const client = await getOrCreateClientForUser(admin, user);

  if (!client.approved) {
    return NextResponse.json(
      { error: "Your account isn't approved for booking yet." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { scheduledAt, durationMinutes } = body as {
    scheduledAt: string;
    durationMinutes: number;
  };

  if (!scheduledAt || !durationMinutes) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!SESSION_DURATIONS_MINUTES.includes(durationMinutes as (typeof SESSION_DURATIONS_MINUTES)[number])) {
    return NextResponse.json({ error: "Invalid duration." }, { status: 400 });
  }

  const sessionStart = new Date(scheduledAt);
  if (Number.isNaN(sessionStart.getTime())) {
    return NextResponse.json({ error: "Please choose a valid future time." }, { status: 400 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 86400000);
  const busy = await fetchBusyIntervals(admin, now.toISOString(), windowEnd.toISOString());

  if (!isSlotStillAvailable(sessionStart, durationMinutes, busy, now)) {
    return NextResponse.json(
      { error: "That time isn't available anymore. Please pick another." },
      { status: 409 }
    );
  }

  const rateCents = Math.round((PRICING.virtualHourlyRateCents * durationMinutes) / 60);

  const { data: session, error: insertError } = await admin
    .from("sessions")
    .insert({
      client_id: client.id,
      type: "virtual",
      status: "pending_payment",
      scheduled_at: sessionStart.toISOString(),
      duration_minutes: durationMinutes,
      rate_cents: rateCents,
    })
    .select()
    .single();

  if (insertError || !session) {
    return NextResponse.json({ error: "Could not create the session." }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: PRICING.currency,
          unit_amount: rateCents,
          product_data: {
            name: `Tutoring session — ${new Date(sessionStart).toLocaleString()}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { sessionId: session.id },
    success_url: `${origin}/portal?booked=1`,
    cancel_url: `${origin}/portal/book?cancelled=1`,
  });

  await admin
    .from("sessions")
    .update({ stripe_checkout_session_id: checkoutSession.id })
    .eq("id", session.id);

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
