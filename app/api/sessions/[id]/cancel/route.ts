import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrCreateClientForUser } from "@/lib/clients";
import { stripe } from "@/lib/stripe";
import { computeRefundCents, type CancelledBy } from "@/lib/pricing";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: session } = await admin
    .from("sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const isTutor = Boolean(
    process.env.TUTOR_EMAIL && user.email === process.env.TUTOR_EMAIL
  );

  let isOwningClient = false;
  if (!isTutor) {
    const client = await getOrCreateClientForUser(admin, user);
    isOwningClient = session.client_id === client.id;
  }

  if (!isTutor && !isOwningClient) {
    return NextResponse.json({ error: "Not your session." }, { status: 403 });
  }

  if (session.status !== "scheduled" && session.status !== "pending_payment") {
    return NextResponse.json(
      { error: "This session can't be cancelled." },
      { status: 400 }
    );
  }

  const cancelledBy: CancelledBy = isTutor ? "tutor" : "client";

  let refundCents = 0;
  if (session.amount_paid_cents > 0 && session.stripe_payment_intent_id) {
    refundCents = computeRefundCents({
      cancelledBy,
      amountPaidCents: session.amount_paid_cents,
      sessionStart: new Date(session.scheduled_at),
    });

    if (refundCents > 0) {
      await stripe.refunds.create({
        payment_intent: session.stripe_payment_intent_id,
        amount: refundCents,
      });
    }
  }

  await admin
    .from("sessions")
    .update({
      status: isTutor ? "cancelled_by_tutor" : "cancelled_by_client",
      cancelled_at: new Date().toISOString(),
      refund_cents: refundCents,
    })
    .eq("id", session.id);

  const redirectUrl = new URL("/portal", request.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
