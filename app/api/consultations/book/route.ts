import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  BOOKING_WINDOW_DAYS,
  CONSULTATION_DURATION_MINUTES,
  isSlotStillAvailable,
} from "@/lib/availability";
import { fetchBusyIntervals } from "@/lib/busyIntervals";
import { setClientApproval } from "@/lib/clients";
import {
  sendConsultationConfirmationToClient,
  sendConsultationNoticeToTutor,
} from "@/lib/email";

export async function POST(request: Request) {
  const body = await request.json();
  const { fullName, email, phone, subject, notes, scheduledAt } = body as {
    fullName: string;
    email: string;
    phone?: string;
    subject?: string;
    notes?: string;
    scheduledAt: string;
  };

  if (!fullName || !email || !scheduledAt) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const slot = new Date(scheduledAt);
  if (Number.isNaN(slot.getTime())) {
    return NextResponse.json({ error: "Invalid time." }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const windowEnd = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 86400000);

  const busy = await fetchBusyIntervals(admin, now.toISOString(), windowEnd.toISOString());

  if (!isSlotStillAvailable(slot, CONSULTATION_DURATION_MINUTES, busy, now)) {
    return NextResponse.json(
      { error: "That time isn't available anymore. Please pick another." },
      { status: 409 }
    );
  }

  const { data: consultation, error: insertError } = await admin
    .from("consultations")
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      subject: subject || null,
      notes: notes || null,
      scheduled_at: slot.toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    // Unique violation on scheduled_at = someone else grabbed it a moment ago.
    if ((insertError as { code?: string }).code === "23505") {
      return NextResponse.json(
        { error: "That time isn't available anymore. Please pick another." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Could not book the consultation." }, { status: 500 });
  }

  // Every consultation is auto-approved immediately -- no manual review gate
  // before someone can log in. The tutor can still revoke this from
  // /portal/admin after the call if it turns out not to be a fit.
  await setClientApproval(admin, {
    email: consultation.email,
    fullName: consultation.full_name,
    phone: consultation.phone,
    approved: true,
  });

  const details = {
    id: consultation.id,
    fullName: consultation.full_name,
    email: consultation.email,
    phone: consultation.phone,
    subject: consultation.subject,
    notes: consultation.notes,
    scheduledAt: new Date(consultation.scheduled_at),
  };

  const origin = new URL(request.url).origin;

  try {
    await Promise.all([
      sendConsultationConfirmationToClient(details, origin),
      sendConsultationNoticeToTutor(details),
    ]);
  } catch (err) {
    // Booking already succeeded; don't fail the request over email delivery.
    console.error("Consultation email failed to send", err);
  }

  return NextResponse.json({ consultation });
}
