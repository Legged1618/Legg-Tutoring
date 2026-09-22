/**
 * Free-consultation availability. Edit WEEKLY_AVAILABILITY to match your
 * real schedule -- everything else derives from it.
 *
 * Known limitation: this only checks against other booked consultations,
 * not against paid tutoring sessions already on the calendar. Until the
 * two are unified, double-check your own calendar before a busy week.
 */

export const TUTOR_TIMEZONE = "America/New_York";
export const CONSULTATION_DURATION_MINUTES = 15;
export const BOOKING_WINDOW_DAYS = 14;
export const MIN_NOTICE_HOURS = 2;

type Window = { weekday: number; start: string; end: string }; // weekday: 0=Sun..6=Sat, start/end: "HH:MM" 24h, in TUTOR_TIMEZONE

// Nothing before noon, any day -- edit freely, just keep every start time >= "12:00".
export const WEEKLY_AVAILABILITY: Window[] = [
  { weekday: 1, start: "16:00", end: "19:00" }, // Monday
  { weekday: 2, start: "16:00", end: "19:00" }, // Tuesday
  { weekday: 3, start: "16:00", end: "19:00" }, // Wednesday
  { weekday: 4, start: "16:00", end: "19:00" }, // Thursday
  { weekday: 6, start: "12:00", end: "15:00" }, // Saturday
];

function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset = tzOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60000);
}

/** All bookable slot start times in the booking window, ignoring existing bookings. */
export function generateCandidateSlots(now: Date = new Date()): Date[] {
  const todayParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TUTOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});

  const anchor = new Date(
    Date.UTC(Number(todayParts.year), Number(todayParts.month) - 1, Number(todayParts.day))
  );

  const slots: Date[] = [];

  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const day = new Date(anchor.getTime() + i * 86400000);
    const year = day.getUTCFullYear();
    const month = day.getUTCMonth() + 1;
    const date = day.getUTCDate();
    const weekday = day.getUTCDay();

    const windows = WEEKLY_AVAILABILITY.filter((w) => w.weekday === weekday);
    for (const w of windows) {
      const [startH, startM] = w.start.split(":").map(Number);
      const [endH, endM] = w.end.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      for (
        let m = startMinutes;
        m + CONSULTATION_DURATION_MINUTES <= endMinutes;
        m += CONSULTATION_DURATION_MINUTES
      ) {
        const hh = Math.floor(m / 60);
        const mm = m % 60;
        slots.push(zonedWallTimeToUtc(year, month, date, hh, mm, TUTOR_TIMEZONE));
      }
    }
  }

  return slots;
}

/** Candidate slots minus already-booked times and anything too soon to book. */
export function getAvailableSlots(
  bookedEpochMs: Set<number>,
  now: Date = new Date()
): Date[] {
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000;
  return generateCandidateSlots(now).filter(
    (slot) => slot.getTime() >= earliest && !bookedEpochMs.has(slot.getTime())
  );
}

export function isSlotStillAvailable(
  slot: Date,
  bookedEpochMs: Set<number>,
  now: Date = new Date()
): boolean {
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000;
  if (slot.getTime() < earliest) return false;
  if (bookedEpochMs.has(slot.getTime())) return false;
  return generateCandidateSlots(now).some((s) => s.getTime() === slot.getTime());
}
