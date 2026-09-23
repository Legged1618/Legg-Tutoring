/**
 * Shared availability engine for both free consultations and paid
 * sessions. Both draw from the same WEEKLY_AVAILABILITY windows and are
 * checked against each other -- a booked consultation blocks that time
 * for sessions and vice versa, since the tutor can only be in one place
 * at a time regardless of which table a booking lives in.
 *
 * Edit WEEKLY_AVAILABILITY to match your real schedule -- everything else
 * derives from it.
 */

export const TUTOR_TIMEZONE = "America/New_York";
export const CONSULTATION_DURATION_MINUTES = 15;
export const SESSION_DURATIONS_MINUTES = [30, 60, 120] as const;
export type SessionDurationMinutes = (typeof SESSION_DURATIONS_MINUTES)[number];

export const BOOKING_WINDOW_DAYS = 14;
export const MIN_NOTICE_HOURS = 2;

// Granularity of possible start times within a window -- independent of
// how long the thing being booked is (e.g. a 2-hour session can still
// start on a 15-minute mark).
const SLOT_STEP_MINUTES = 15;

type Window = { weekday: number; start: string; end: string }; // weekday: 0=Sun..6=Sat, start/end: "HH:MM" 24h, in TUTOR_TIMEZONE

// Nothing before noon, any day -- edit freely, just keep every start time >= "12:00".
export const WEEKLY_AVAILABILITY: Window[] = [
  { weekday: 1, start: "16:00", end: "19:00" }, // Monday
  { weekday: 2, start: "16:00", end: "19:00" }, // Tuesday
  { weekday: 3, start: "16:00", end: "19:00" }, // Wednesday
  { weekday: 4, start: "16:00", end: "19:00" }, // Thursday
  { weekday: 6, start: "12:00", end: "15:00" }, // Saturday
];

export type BusyInterval = { start: Date; end: Date };

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

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
}

/**
 * All possible start times in the booking window where a booking of
 * `durationMinutes` would fit entirely inside an availability window,
 * ignoring existing bookings.
 */
export function generateCandidateSlotStarts(
  durationMinutes: number,
  now: Date = new Date()
): Date[] {
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
        m + durationMinutes <= endMinutes;
        m += SLOT_STEP_MINUTES
      ) {
        const hh = Math.floor(m / 60);
        const mm = m % 60;
        slots.push(zonedWallTimeToUtc(year, month, date, hh, mm, TUTOR_TIMEZONE));
      }
    }
  }

  return slots;
}

/** Candidate slots minus anything overlapping an existing booking or too soon to book. */
export function getAvailableSlots(
  durationMinutes: number,
  busy: BusyInterval[],
  now: Date = new Date()
): Date[] {
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000;
  return generateCandidateSlotStarts(durationMinutes, now).filter((slotStart) => {
    if (slotStart.getTime() < earliest) return false;
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);
    return !busy.some((b) => overlaps(slotStart, slotEnd, b.start, b.end));
  });
}

export function isSlotStillAvailable(
  slot: Date,
  durationMinutes: number,
  busy: BusyInterval[],
  now: Date = new Date()
): boolean {
  const earliest = now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000;
  if (slot.getTime() < earliest) return false;
  const slotEnd = new Date(slot.getTime() + durationMinutes * 60000);
  if (busy.some((b) => overlaps(slot, slotEnd, b.start, b.end))) return false;
  return generateCandidateSlotStarts(durationMinutes, now).some(
    (s) => s.getTime() === slot.getTime()
  );
}
