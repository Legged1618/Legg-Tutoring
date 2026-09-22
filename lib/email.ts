import { Resend } from "resend";

let resendClient: Resend | null = null;

// Lazily constructed, same reasoning as lib/stripe.ts: don't require the
// API key at build/import time, only when an email actually needs sending.
function getResend(): Resend {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set.");
    }
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || "Legg Tutoring <onboarding@resend.dev>";
}

export type ConsultationDetails = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  notes?: string | null;
  scheduledAt: Date;
};

function formatWhen(date: Date): string {
  return date.toLocaleString("en-US", {
    timeZone: process.env.TUTOR_TIMEZONE || "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export async function sendConsultationConfirmationToClient(
  c: ConsultationDetails,
  origin: string
) {
  const when = formatWhen(c.scheduledAt);
  const cancelUrl = `${origin}/consultation/cancel/${c.id}`;
  await getResend().emails.send({
    from: fromAddress(),
    to: c.email,
    subject: "Your free consultation is booked — Legg Tutoring",
    text: `Hi ${c.fullName},

Your free 15-minute consultation call is confirmed for:

${when}

We'll cover what you're looking for help with and whether it's a good fit. If you need to cancel, use this link:

${cancelUrl}

Talk soon,
Legg Tutoring`,
  });
}

export async function sendConsultationNoticeToTutor(c: ConsultationDetails) {
  const when = formatWhen(c.scheduledAt);
  const scriptUrl = process.env.CALL_SCRIPT_URL;
  const tutorEmail = process.env.TUTOR_EMAIL;

  if (!tutorEmail) return;

  await getResend().emails.send({
    from: fromAddress(),
    to: tutorEmail,
    subject: `New consultation booked: ${c.fullName} — ${when}`,
    text: `New free consultation booked.

When: ${when}
Name: ${c.fullName}
Email: ${c.email}
Phone: ${c.phone || "(not provided)"}
Subject / grade level: ${c.subject || "(not provided)"}
Notes from them: ${c.notes || "(none)"}

${c.email} already has portal access (every consultation is auto-approved) -- no action needed there.

What to do:
1. ${scriptUrl ? `Open the call script: ${scriptUrl}` : "Open your call script (set CALL_SCRIPT_URL in env to link it here automatically)."}
2. At the scheduled time, call/video with ${c.fullName}.
3. If it turns out NOT to be a good fit, go to /portal/admin and mark this consultation "Not a fit" to revoke their portal access.

Consultation ID: ${c.id}`,
  });
}
