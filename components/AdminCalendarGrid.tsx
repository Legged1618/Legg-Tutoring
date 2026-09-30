"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type CalendarEntry = {
  id: string;
  kind: "consultation" | "session";
  startIso: string;
  timeLabel: string;
  title: string;
  colorState: "upcoming" | "resolved";
  checklist: string;
  scriptUrl?: string;
  status: string;
  outcome?: string;
  clientEmail?: string;
  clientPhone?: string;
};

export type CalendarDay = {
  dateKey: string;
  dayNumber: number;
  weekdayLabel: string;
  monthLabel: string;
  isToday: boolean;
  isOff: boolean;
  offReason?: string;
  entries: CalendarEntry[];
};

export default function AdminCalendarGrid({
  days,
  rangeLabel,
  prevHref,
  nextHref,
  todayHref,
  isTodayWindow,
}: {
  days: CalendarDay[];
  rangeLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  isTodayWindow: boolean;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const selectedDay = days.find((d) => d.dateKey === selectedDateKey) ?? null;
  const selectedEntry = selectedDay?.entries.find((e) => e.id === selectedEntryId) ?? null;

  function selectDay(dateKey: string) {
    setSelectedEntryId(null);
    setSelectedDateKey((current) => (current === dateKey ? null : dateKey));
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
          return (
            <button
              type="button"
              key={day.dateKey}
              className={`cal-day${day.isToday ? " today" : ""}${
                selectedDateKey === day.dateKey ? " selected" : ""
              }${day.isOff ? " off" : ""}`}
              onClick={() => selectDay(day.dateKey)}
            >
              <span className="cal-day-number">
                {showMonth ? `${day.monthLabel} ` : ""}
                {day.dayNumber}
              </span>
              {day.isOff && <span className="cal-off-badge">Off</span>}
              <span className="cal-day-pills">
                {day.entries.slice(0, 3).map((entry) => (
                  <span
                    key={entry.id}
                    className={`cal-pill ${entry.kind}-${entry.colorState}`}
                  />
                ))}
                {day.entries.length > 3 && (
                  <span className="cal-pill-more">+{day.entries.length - 3}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay && !selectedEntry && (
        <div className="cal-detail-panel page-fade" key={selectedDay.dateKey}>
          <div className="cal-detail-header">
            <h4>
              {selectedDay.weekdayLabel}, {selectedDay.monthLabel} {selectedDay.dayNumber}
            </h4>
            <button type="button" className="cal-close-btn" onClick={() => setSelectedDateKey(null)}>
              Close
            </button>
          </div>
          {selectedDay.entries.length === 0 && <p className="notice">Nothing this day.</p>}
          {selectedDay.entries.map((entry) => (
            <button
              type="button"
              key={entry.id}
              className="cal-entry-row"
              onClick={() => setSelectedEntryId(entry.id)}
            >
              <span className={`cal-pill ${entry.kind}-${entry.colorState}`} />
              <span>
                <strong>{entry.timeLabel}</strong> &middot; {entry.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedDay && selectedEntry && (
        <div className="cal-detail-panel page-fade" key={selectedEntry.id}>
          <div className="cal-detail-header">
            <button type="button" className="cal-back-btn" onClick={() => setSelectedEntryId(null)}>
              &larr; Back to {selectedDay.weekdayLabel}, {selectedDay.monthLabel} {selectedDay.dayNumber}
            </button>
            <button type="button" className="cal-close-btn" onClick={() => setSelectedDateKey(null)}>
              Close
            </button>
          </div>

          <h4>
            {selectedEntry.timeLabel} &middot; {selectedEntry.title}
          </h4>
          <p className="meta">
            {selectedEntry.kind === "consultation" ? "Consultation" : "Session"} &middot; status:{" "}
            {selectedEntry.status.replaceAll("_", " ")}
            {selectedEntry.outcome ? ` · outcome: ${selectedEntry.outcome.replaceAll("_", " ")}` : ""}
          </p>
          {selectedEntry.clientEmail && (
            <p className="meta">
              {selectedEntry.clientEmail}
              {selectedEntry.clientPhone ? ` · ${selectedEntry.clientPhone}` : ""}
            </p>
          )}

          <pre className="cal-detail-checklist">{selectedEntry.checklist}</pre>

          {selectedEntry.kind === "consultation" && selectedEntry.scriptUrl && (
            <p className="notice" style={{ marginTop: 10 }}>
              Script:{" "}
              <a href={selectedEntry.scriptUrl} target="_blank" rel="noreferrer">
                {selectedEntry.scriptUrl}
              </a>
            </p>
          )}

          <div className="cal-action-row">
            {selectedEntry.kind === "consultation" &&
              selectedEntry.status === "scheduled" &&
              selectedEntry.outcome === "pending" && (
                <>
                  <form
                    action={`/api/consultations/${selectedEntry.id}/outcome?next=${encodeURIComponent(returnTo)}`}
                    method="post"
                  >
                    <input type="hidden" name="outcome" value="good_fit" />
                    <button className="btn" type="submit" style={{ width: "auto" }}>
                      Good fit
                    </button>
                  </form>
                  <form
                    action={`/api/consultations/${selectedEntry.id}/outcome?next=${encodeURIComponent(returnTo)}`}
                    method="post"
                  >
                    <input type="hidden" name="outcome" value="not_a_fit" />
                    <button className="btn btn-secondary" type="submit" style={{ width: "auto" }}>
                      Not a fit
                    </button>
                  </form>
                </>
              )}

            {selectedEntry.kind === "consultation" && selectedEntry.status === "scheduled" && (
              <form
                action={`/api/consultations/${selectedEntry.id}/cancel?next=${encodeURIComponent(returnTo)}`}
                method="post"
              >
                <button className="btn btn-secondary" type="submit" style={{ width: "auto" }}>
                  Cancel
                </button>
              </form>
            )}

            {selectedEntry.kind === "session" &&
              (selectedEntry.status === "scheduled" || selectedEntry.status === "pending_payment") && (
                <form
                  action={`/api/sessions/${selectedEntry.id}/cancel?next=${encodeURIComponent(returnTo)}`}
                  method="post"
                >
                  <button className="btn btn-secondary" type="submit" style={{ width: "auto" }}>
                    Cancel
                  </button>
                </form>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
