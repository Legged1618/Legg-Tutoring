import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const sessionId = checkoutSession.metadata?.sessionId;
    if (sessionId) {
      await admin
        .from("sessions")
        .update({
          status: "scheduled",
          amount_paid_cents: checkoutSession.amount_total ?? 0,
          stripe_payment_intent_id: checkoutSession.payment_intent as string,
        })
        .eq("id", sessionId);
    }
  }

  return NextResponse.json({ received: true });
}
