import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { stripe } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";

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
  const { type, scheduledAt, durationMinutes, location } = body as {
    type: "virtual" | "in_person";
    scheduledAt: string;
    durationMinutes: number;
    location?: string;
  };

  if (!type || !scheduledAt || !durationMinutes) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (type === "in_person" && !location) {
    return NextResponse.json(
      { error: "Please choose a location for the in-person session." },
      { status: 400 }
    );
  }

  const sessionStart = new Date(scheduledAt);
  if (Number.isNaN(sessionStart.getTime()) || sessionStart < new Date()) {
    return NextResponse.json({ error: "Please choose a valid future time." }, { status: 400 });
  }

  const hourlyRateCents =
    type === "virtual" ? PRICING.virtualHourlyRateCents : PRICING.inPersonHourlyRateCents;
  const rateCents = Math.round((hourlyRateCents * durationMinutes) / 60);

  const { data: session, error: insertError } = await admin
    .from("sessions")
    .insert({
      client_id: client.id,
      type,
      status: type === "virtual" ? "pending_payment" : "scheduled",
      scheduled_at: sessionStart.toISOString(),
      duration_minutes: durationMinutes,
      location: location ?? null,
      rate_cents: rateCents,
    })
    .select()
    .single();

  if (insertError || !session) {
    return NextResponse.json({ error: "Could not create the session." }, { status: 500 });
  }

  if (type === "in_person") {
    // No payment required upfront, per policy.
    return NextResponse.json({ session });
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
