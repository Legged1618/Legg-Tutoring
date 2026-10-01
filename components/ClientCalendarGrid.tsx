"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import SessionBooking from "@/components/SessionBooking";

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

export default function ClientCalendarGrid({
  days,
  rangeLabel,
  prevHref,
  nextHref,
  todayHref,
  isTodayWindow,
  approved,
}: {
  days: ClientCalendarDay[];
  rangeLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  isTodayWindow: boolean;
  approved: boolean;
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
        <Link href={prevHref} className="btn btn-secondary cal-nav-btn">
          &larr; Previous
        </Link>
        <div className="cal-nav-label">
          <strong>{rangeLabel}</strong>
          {!isTodayWindow && (
            <Link href={todayHref} className="cal-today-link">
              Jump to today
            </Link>
          )}
        </div>
        <Link href={nextHref} className="btn btn-secondary cal-nav-btn">
          Next &rarr;
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
          return (
            <button
              type="button"
              key={day.dateKey}
              className={`cal-day${day.isToday ? " today" : ""}${
                selectedDateKey === day.dateKey ? " selected" : ""
              }${!hasSession && !day.isBookable ? " off" : ""}`}
              onClick={() => selectDay(day)}
            >
              <span className="cal-day-number">
                {showMonth ? `${day.monthLabel} ` : ""}
                {day.dayNumber}
              </span>
              <span className="cal-day-pills">
                {hasSession && <span className="cal-pill your-session" />}
                {!hasSession && day.isBookable && <span className="cal-pill bookable" />}
              </span>
            </button>
          );
        })}
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
            <div className="cal-entry-row" key={s.id} style={{ cursor: "default" }}>
              <span className="cal-pill your-session" />
              <span style={{ flex: 1 }}>
                <strong>{s.timeLabel}</strong> &middot; {s.title}
                <div className="meta">{s.status.replaceAll("_", " ")}</div>
              </span>
              {s.status === "scheduled" && (
                <Link href={`/portal/session/${s.id}`} className="btn" style={{ width: "auto" }}>
                  Join
                </Link>
              )}
              {s.status === "scheduled" && (
                <Link
                  href={`/portal/messages?session=${s.id}`}
                  className="btn btn-secondary"
                  style={{ width: "auto" }}
                >
                  Message
                </Link>
              )}
              {(s.status === "scheduled" || s.status === "pending_payment") && (
                <form
                  action={`/api/sessions/${s.id}/cancel?next=${encodeURIComponent(returnTo)}`}
                  method="post"
                >
                  <button className="btn btn-secondary" type="submit" style={{ width: "auto" }}>
                    Cancel
                  </button>
                </form>
              )}
            </div>
          ))}

          {selectedDay.sessions.length === 0 && !selectedDay.isBookable && (
            <p className="notice">Nothing available this day.</p>
          )}

          {selectedDay.isBookable && !approved && (
            <p className="notice" style={{ marginTop: selectedDay.sessions.length > 0 ? 16 : 0 }}>
              Book a free consultation call on the <Link href="/">main page</Link> to get started.
              If Legg Tutoring is a good fit for your needs, you&apos;ll book sessions on this page.
            </p>
          )}

          {selectedDay.isBookable && approved && !booking && (
            <div style={{ textAlign: "center", marginTop: selectedDay.sessions.length > 0 ? 16 : 0 }}>
              <button type="button" className="btn" style={{ width: "auto" }} onClick={() => setBooking(true)}>
                Book a session this day
              </button>
            </div>
          )}

          {selectedDay.isBookable && approved && booking && (
            <div className="page-fade" key={`booking-${selectedDay.dateKey}`} style={{ marginTop: 16 }}>
              <SessionBooking initialDate={selectedDay.dateKey} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
