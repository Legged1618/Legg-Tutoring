"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SessionBooking from "@/components/SessionBooking";
import StatusPill from "@/components/StatusPill";

export type ClientSessionEntry = {
  id: string;
  timeLabel: string;
  title: string;
  status: string;
};

export type ClientCalendarDay = {
  dateKey: string;
  dayNumber: number;
  weekdayLabel: string;
  monthLabel: string;
  isToday: boolean;
  isBookable: boolean;
  sessions: ClientSessionEntry[];
};

/** "3:00 PM" -> "3p", "3:30 PM" -> "3:30p", for the cramped day cells. */
function compactTime(label: string): string {
  return label.replace(":00", "").replace(" AM", "a").replace(" PM", "p");
}

function isActive(status: string) {
  return status === "scheduled" || status === "pending_payment";
}

export default function ClientCalendarGrid({
  days,
  rangeLabel,
  prevHref,
  nextHref,
  todayHref,
  isTodayWindow,
  approved,
  todayKey,
}: {
  days: ClientCalendarDay[];
  rangeLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  isTodayWindow: boolean;
  approved: boolean;
  todayKey: string;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const selectedDay = days.find((d) => d.dateKey === selectedDateKey) ?? null;

  function selectDay(day: ClientCalendarDay) {
    setBooking(false);
    setSelectedDateKey((current) => (current === day.dateKey ? null : day.dateKey));
  }

  return (
    <div>
      <div className="cal-nav">
        <Link href={prevHref} className="btn btn-secondary cal-nav-btn" aria-label="Previous four weeks">
          &larr; <span className="cal-nav-word">Previous</span>
        </Link>
        <div className="cal-nav-label">
          <strong>{rangeLabel}</strong>
          {!isTodayWindow && (
            <Link href={todayHref} className="cal-today-link">
              Jump to today
            </Link>
          )}
        </div>
        <Link href={nextHref} className="btn btn-secondary cal-nav-btn" aria-label="Next four weeks">
          <span className="cal-nav-word">Next</span> &rarr;
        </Link>
      </div>

      <div className="cal-weekdays">
        {days.slice(0, 7).map((d) => (
          <div key={d.dateKey} className="cal-weekday">
            {d.weekdayLabel}
          </div>
        ))}
      </div>

      <div className="cal-grid">
        {days.map((day, i) => {
          const showMonth = i === 0 || day.dayNumber === 1;
          const hasSession = day.sessions.length > 0;
          const isPast = day.dateKey < todayKey;
          return (
            <button
              type="button"
              key={day.dateKey}
              className={`cal-day${day.isToday ? " today" : ""}${
                selectedDateKey === day.dateKey ? " selected" : ""
              }${!hasSession && !day.isBookable && !isPast ? " off" : ""}${isPast ? " past" : ""}${
                day.isBookable && !hasSession ? " open" : ""
              }`}
              onClick={() => selectDay(day)}
              aria-label={`${day.weekdayLabel} ${day.monthLabel} ${day.dayNumber}${
                hasSession ? `, ${day.sessions.length} session${day.sessions.length === 1 ? "" : "s"}` : ""
              }${day.isBookable ? ", open for booking" : ""}`}
            >
              <span className="cal-day-top">
                <span className="cal-day-number">
                  {showMonth ? `${day.monthLabel} ` : ""}
                  {day.dayNumber}
                </span>
              </span>
              <span className="cal-day-labels">
                {day.sessions.slice(0, 2).map((s) => (
                  <span
                    key={s.id}
                    className={`cal-label ${isActive(s.status) && !isPast ? "session-upcoming" : "session-resolved"}`}
                  >
                    {compactTime(s.timeLabel)}
                  </span>
                ))}
                {day.sessions.length > 2 && (
                  <span className="cal-label-more">+{day.sessions.length - 2} more</span>
                )}
                {!hasSession && day.isBookable && <span className="cal-label open">Open</span>}
              </span>
              <span className="cal-day-pills">
                {hasSession && <span className="cal-pill your-session" />}
                {!hasSession && day.isBookable && <span className="cal-pill bookable" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span>
          <span className="cal-pill your-session" /> Your session
        </span>
        {approved && (
          <span>
            <span className="cal-pill bookable" /> Open for booking
          </span>
        )}
      </div>

      {selectedDay && (
        <div className="cal-detail-panel page-fade" key={selectedDay.dateKey}>
          <div className="cal-detail-header">
            <h4>
              {selectedDay.weekdayLabel}, {selectedDay.monthLabel} {selectedDay.dayNumber}
            </h4>
            <button type="button" className="cal-close-btn" onClick={() => setSelectedDateKey(null)}>
              Close
            </button>
          </div>

          {selectedDay.sessions.map((s) => (
            <div className="cal-entry-row static" key={s.id}>
              <span className="cal-pill your-session" />
              <span className="cal-entry-main">
                <strong>{s.timeLabel}</strong> &middot; {s.title}
                <span className="cal-entry-sub">
                  <StatusPill value={s.status} />
                </span>
              </span>
              <span className="cal-entry-actions">
                {s.status === "scheduled" && (
                  <Link href={`/portal/session/${s.id}`} className="btn btn-auto btn-sm">
                    Join
                  </Link>
                )}
                {s.status === "scheduled" && (
                  <Link href={`/portal/messages?session=${s.id}`} className="btn btn-secondary btn-auto btn-sm">
                    Message
                  </Link>
                )}
                {isActive(s.status) && (
                  <form
                    action={`/api/sessions/${s.id}/cancel?next=${encodeURIComponent(returnTo)}`}
                    method="post"
                  >
                    <button className="btn btn-secondary btn-auto btn-sm btn-danger" type="submit">
                      Cancel
                    </button>
                  </form>
                )}
              </span>
            </div>
          ))}

          {selectedDay.sessions.length === 0 && !selectedDay.isBookable && (
            <p className="empty-state">Nothing available this day.</p>
          )}

          {selectedDay.isBookable && !approved && (
            <p className="notice" style={{ marginTop: selectedDay.sessions.length > 0 ? 16 : 0 }}>
              Book a free consultation call on the <Link href="/">main page</Link> to get started.
              If Legg Tutoring is a good fit for your needs, you&apos;ll book sessions on this page.
            </p>
          )}

          {selectedDay.isBookable && approved && !booking && (
            <div className="cal-book-row">
              <button type="button" className="btn btn-auto" onClick={() => setBooking(true)}>
                Book a session this day
              </button>
            </div>
          )}

          {selectedDay.isBookable && approved && booking && (
            <div className="page-fade cal-book-form" key={`booking-${selectedDay.dateKey}`}>
              <SessionBooking initialDate={selectedDay.dateKey} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
