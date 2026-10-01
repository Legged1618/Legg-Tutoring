import { NextResponse } from "next/server";
import { notifyTutor } from "@/lib/push";
import { formatShort } from "@/lib/format";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { sendSessionConfirmationToClient } from "@/lib/email";

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
      const { data: session } = await admin
        .from("sessions")
        .update({
          status: "scheduled",
          amount_paid_cents: checkoutSession.amount_total ?? 0,
          stripe_payment_intent_id: checkoutSession.payment_intent as string,
        })
        .eq("id", sessionId)
        .select("*, clients(full_name, email, phone)")
        .single();

      // Only now -- payment confirmed, not at checkout-initiation -- does
      // this session become real enough to notify anyone about.
      if (session) {
        const client = session.clients as {
          full_name: string | null;
          email: string;
          phone: string | null;
        } | null;
        const details = {
          id: session.id,
          scheduledAt: new Date(session.scheduled_at),
          durationMinutes: session.duration_minutes,
          rateCents: session.rate_cents,
          clientName: client?.full_name ?? null,
          clientEmail: client?.email ?? "",
          clientPhone: client?.phone ?? null,
        };
        try {
          await sendSessionConfirmationToClient(details, new URL(request.url).origin);
        } catch (err) {
          console.error("Session confirmation email failed to send", err);
        }
        await notifyTutor({
          title: "New paid session",
          body: `${client?.full_name || client?.email || "A client"}, ${session.duration_minutes} min, ${formatShort(details.scheduledAt)}`,
          url: `/portal/admin/clients/${session.client_id}`,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
