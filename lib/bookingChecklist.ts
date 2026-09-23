/** Shared "what to do" text used by both the ICS calendar feed and the in-app admin calendar. */

export function buildConsultationChecklist(
  c: { full_name: string; email: string; phone: string | null; subject: string | null; notes: string | null },
  scriptUrl?: string
): string {
  return [
    "To do:",
    scriptUrl ? `☐ Open the call script: ${scriptUrl}` : "☐ Open your call script",
    `☐ Call/video with ${c.full_name} at the scheduled time`,
    "☐ Afterward, mark \"Good fit\" or \"Not a fit\" in the Consultations tab",
    "",
    `Contact: ${c.email}${c.phone ? ` · ${c.phone}` : ""}`,
    c.subject ? `Subject: ${c.subject}` : null,
    c.notes ? `Notes: ${c.notes}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function buildSessionChecklist(
  s: { rate_cents: number },
  client: { full_name: string | null; email: string; phone: string | null } | null
): string {
  const label = client?.full_name || client?.email || "the client";
  return [
    "To do:",
    `☐ Join the video call with ${label} at the scheduled time`,
    `☐ Paid in full ($${(s.rate_cents / 100).toFixed(2)}) — no payment action needed`,
    "",
    client?.email ? `Contact: ${client.email}${client.phone ? ` · ${client.phone}` : ""}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
