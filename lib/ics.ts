/** Minimal RFC 5545 ICS builder -- just enough for a read-only feed. */

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type IcsEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  location?: string;
};

export function buildIcsFeed(calendarName: string, events: IcsEvent[]): string {
  const now = formatDate(new Date());

  const vevents = events.map((e) =>
    [
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatDate(e.start)}`,
      `DTEND:${formatDate(e.end)}`,
      `SUMMARY:${escapeText(e.summary)}`,
      `DESCRIPTION:${escapeText(e.description)}`,
      ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
      "END:VEVENT",
    ].join("\r\n")
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Legg Tutoring//Booking Feed//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}
