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
  const roomUrl = `${origin}/consultation/room/${c.id}`;
  await getResend().emails.send({
    from: fromAddress(),
    to: c.email,
    subject: "Your free consultation is booked — Legg Tutoring",
    text: `Hi ${c.fullName},

Your free 15-minute consultation call is confirmed for:

${when}

We'll cover what you're looking for help with and whether it's a good fit. At the scheduled time, join the call here (it opens 10 minutes early, right in your browser, with no download or account needed):

${roomUrl}

If you need to cancel, use this link:

${cancelUrl}

Talk soon,
Legg Tutoring`,
  });
}

export type SessionDetails = {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  rateCents: number;
  clientName: string | null;
  clientEmail: string;
  clientPhone: string | null;
};

export async function sendSessionConfirmationToClient(s: SessionDetails, origin: string) {
  const when = formatWhen(s.scheduledAt);
  const roomUrl = `${origin}/portal/session/${s.id}`;
  await getResend().emails.send({
    from: fromAddress(),
    to: s.clientEmail,
    subject: "Your tutoring session is confirmed — Legg Tutoring",
    text: `Hi ${s.clientName || "there"},

Your ${s.durationMinutes}-minute virtual tutoring session is confirmed and paid for:

${when}

At the scheduled time, join your session here (it opens 10 minutes early, right in your browser):

${roomUrl}

To cancel or reschedule, sign into your portal at any time -- cancelling 24+ hours out gets a full refund, inside 24 hours a $10 flat fee applies.

See you then,
Legg Tutoring`,
  });
}

