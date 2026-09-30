import { TUTOR_TIMEZONE, zonedWallTimeToUtc, shiftDateKey } from "@/lib/availability";

/**
 * Shared rolling-week calendar windowing, used by both the admin and
 * client calendars. Always Monday-aligned -- windowDays should be a
 * multiple of 7, so Previous/Next paging never drifts off the week grid.
 */

export type CalendarDayMeta = {
  dateKey: string;
  dayNumber: number;
  weekdayLabel: string;
  monthLabel: string;
};

export type CalendarWindow = {
  windowStartKey: string;
  todayKey: string;
  mondayKey: string;
  boundaries: Date[];
  dayMeta: CalendarDayMeta[];
  rangeLabel: string;
  prevKey: string;
  nextKey: string;
};

export function todayKeyInTutorTz(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TUTOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function dateKeyFor(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TUTOR_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function mostRecentMonday(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (weekday + 6) % 7;
  return shiftDateKey(dateKey, -daysSinceMonday);
}

export function computeCalendarWindow(
  windowDays: number,
  startParam: string | undefined,
  now: Date
): CalendarWindow {
  const todayKey = todayKeyInTutorTz(now);
  const mondayKey = mostRecentMonday(todayKey);
  const windowStartKey =
    startParam && /^\d{4}-\d{2}-\d{2}$/.test(startParam) ? startParam : mondayKey;

  const boundaries: Date[] = [];
  const dayMeta: CalendarDayMeta[] = [];
  const [sy, sm, sd] = windowStartKey.split("-").map(Number);

  for (let i = 0; i <= windowDays; i++) {
    const anchor = new Date(Date.UTC(sy, sm - 1, sd + i));
    const y = anchor.getUTCFullYear();
    const m = anchor.getUTCMonth() + 1;
    const d = anchor.getUTCDate();
    boundaries.push(zonedWallTimeToUtc(y, m, d, 0, 0, TUTOR_TIMEZONE));
    if (i < windowDays) {
      dayMeta.push({
        dateKey: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        dayNumber: d,
        weekdayLabel: boundaries[i].toLocaleDateString("en-US", {
          timeZone: TUTOR_TIMEZONE,
          weekday: "short",
        }),
        monthLabel: boundaries[i].toLocaleDateString("en-US", {
          timeZone: TUTOR_TIMEZONE,
          month: "short",
        }),
      });
    }
  }

  const rangeLabel = `${boundaries[0].toLocaleDateString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    month: "short",
    day: "numeric",
  })} – ${boundaries[windowDays - 1].toLocaleDateString("en-US", {
    timeZone: TUTOR_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;

  return {
    windowStartKey,
    todayKey,
    mondayKey,
    boundaries,
    dayMeta,
    rangeLabel,
    prevKey: shiftDateKey(windowStartKey, -windowDays),
    nextKey: shiftDateKey(windowStartKey, windowDays),
  };
}
