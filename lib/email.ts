import { Resend } from "resend";
import { formatWhen } from "@/lib/format";
import { consultationMeetingUrl } from "@/lib/consultationMeeting";

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


export async function sendConsultationConfirmationToClient(
  c: ConsultationDetails,
  origin: string
) {
  const when = formatWhen(c.scheduledAt);
  const cancelUrl = `${origin}/consultation/cancel/${c.id}`;
  const meetingUrl = consultationMeetingUrl();
  const joinText = meetingUrl
    ? `Join the video call here at the scheduled time:

${meetingUrl}

It works on a laptop, tablet or phone with a camera.`
    : "You'll get the video call link by email before the call. It works on a laptop, tablet or phone with a camera.";
  await getResend().emails.send({
    from: fromAddress(),
    to: c.email,
    subject: "Your free consultation is booked — Legg Tutoring",
    text: `Hi ${c.fullName},

Your free 15-minute consultation is confirmed for:

${when}

${joinText}

We'll cover what you're looking for help with and whether it's a good fit. If you need to cancel, use this link:

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
    subject: "Your session is confirmed!",
    text: `Hello${s.clientName ? ` ${s.clientName}` : ""},

Your ${s.durationMinutes}-minute virtual tutoring session is confirmed and paid for:

${when}

At the scheduled time, join your session here (it opens 10 minutes early, right in your browser):

${roomUrl}

To cancel your session, sign in to your portal at any time.

See you then,
Legg Tutoring`,
  });
}


export async function sendNewMessageToClient(
  c: { clientName: string | null; clientEmail: string },
  origin: string
) {
  await getResend().emails.send({
    from: fromAddress(),
    to: c.clientEmail,
    subject: "You have a new message from Legg Tutoring",
    text: `Hello${c.clientName ? ` ${c.clientName}` : ""},

You have a new message from your tutor. Read and reply in your portal:

${origin}/portal/messages

Legg Tutoring`,
  });
}
