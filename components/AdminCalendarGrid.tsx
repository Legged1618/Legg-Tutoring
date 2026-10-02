"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import StatusPill from "@/components/StatusPill";

export type CalendarEntry = {
  id: string;
  kind: "consultation" | "session";
  startIso: string;
  timeLabel: string;
  title: string;
  colorState: "upcoming" | "resolved";
  scriptUrl?: string;
  /** Sessions only: "Paid $65.00", "Not paid yet", etc. */
  payment?: string;
  status: string;
  outcome?: string;
  clientEmail?: string;
  clientPhone?: string;
  roomHref?: string;
  /** Consultations only: the video call link. */
  meetingHref?: string;
  clientHref?: string;
  subject?: string;
  notes?: string;
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

/** "3:00 PM" -> "3p", "3:30 PM" -> "3:30p", for the cramped day cells. */
function compactTime(label: string): string {
  return label.replace(":00", "").replace(" AM", "a").replace(" PM", "p");
}

function firstWord(title: string): string {
  return title.split(/[\s(]/)[0] || title;
}

export default function AdminCalendarGrid({
  days,
  rangeLabel,
  prevHref,
  nextHref,
  todayHref,
  isTodayWindow,
  todayKey,
}: {
  days: CalendarDay[];
  rangeLabel: string;
  prevHref: string;
  nextHref: string;
  todayHref: string;
  isTodayWindow: boolean;
  todayKey: string;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const returnTo = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const selectedDay = days.find((d) => d.dateKey === selectedDateKey) ?? null;
  const selectedEntry = selectedDay?.entries.find((e) => e.id === selectedEntryId) ?? null;

  // Everything still ahead in this window, for the "Coming up" list.
  const upcomingDays = days.filter(
    (d) => d.dateKey >= todayKey && d.entries.some((e) => e.colorState === "upcoming")
  );

  function selectDay(dateKey: string) {
    setSelectedEntryId(null);
    setSelectedDateKey((current) => (current === dateKey ? null : dateKey));
  }

  function openEntry(dateKey: string, entryId: string) {
    setSelectedDateKey(dateKey);
    setSelectedEntryId(entryId);
    requestAnimationFrame(() =>
      document.getElementById("cal-detail")?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    );
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
          const isPast = day.dateKey < todayKey;
          return (
            <button
              type="button"
              key={day.dateKey}
              className={`cal-day${day.isToday ? " today" : ""}${
                selectedDateKey === day.dateKey ? " selected" : ""
              }${day.isOff ? " off" : ""}${isPast ? " past" : ""}`}
              onClick={() => selectDay(day.dateKey)}
              aria-label={`${day.weekdayLabel} ${day.monthLabel} ${day.dayNumber}, ${day.entries.length} booking${
                day.entries.length === 1 ? "" : "s"
              }`}
            >
              <span className="cal-day-top">
                <span className="cal-day-number">
                  {showMonth ? `${day.monthLabel} ` : ""}
                  {day.dayNumber}
                </span>
                {day.isOff && <span className="cal-off-badge">Off</span>}
              </span>
              <span className="cal-day-labels">
                {day.entries.slice(0, 3).map((entry) => (
                  <span key={entry.id} className={`cal-label ${entry.kind}-${entry.colorState}`}>
                    {compactTime(entry.timeLabel)} {firstWord(entry.title)}
                  </span>
                ))}
                {day.entries.length > 3 && <span className="cal-label-more">+{day.entries.length - 3} more</span>}
              </span>
              <span className="cal-day-pills">
                {day.entries.slice(0, 4).map((entry) => (
                  <span key={entry.id} className={`cal-pill ${entry.kind}-${entry.colorState}`} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span>
          <span className="cal-pill consultation-upcoming" /> Consultation
        </span>
        <span>
          <span className="cal-pill session-upcoming" /> Session
        </span>
        <span>
          <span className="cal-pill session-resolved" /> Past or cancelled
        </span>
        <span>
          <span className="cal-legend-off" /> Time off
        </span>
      </div>

      {selectedDay && !selectedEntry && (
        <div className="cal-detail-panel page-fade" id="cal-detail" key={selectedDay.dateKey}>
          <div className="cal-detail-header">
            <h4>
              {selectedDay.weekdayLabel}, {selectedDay.monthLabel} {selectedDay.dayNumber}
              {selectedDay.isOff && (
                <span className="status-pill muted" style={{ marginLeft: 10 }}>
                  Off{selectedDay.offReason ? `: ${selectedDay.offReason}` : ""}
                </span>
              )}
            </h4>
            <button type="button" className="cal-close-btn" onClick={() => setSelectedDateKey(null)}>
              Close
            </button>
          </div>
          {selectedDay.entries.length === 0 && <p className="empty-state">Nothing this day.</p>}
          {selectedDay.entries.map((entry) => (
            <button
              type="button"
              key={entry.id}
              className="cal-entry-row"
              onClick={() => setSelectedEntryId(entry.id)}
            >
              <span className={`cal-pill ${entry.kind}-${entry.colorState}`} />
              <span className="cal-entry-main">
                <strong>{entry.timeLabel}</strong> &middot; {entry.title}
              </span>
              <StatusPill value={entry.status} />
              <span className="cal-entry-chevron" aria-hidden="true">
                &rsaquo;
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedDay && selectedEntry && (
        <div className="cal-detail-panel page-fade" id="cal-detail" key={selectedEntry.id}>
          <div className="cal-detail-header">
            <button type="button" className="cal-back-btn" onClick={() => setSelectedEntryId(null)}>
              &larr; Back to {selectedDay.weekdayLabel}, {selectedDay.monthLabel} {selectedDay.dayNumber}
            </button>
            <button type="button" className="cal-close-btn" onClick={() => setSelectedDateKey(null)}>
              Close
            </button>
          </div>

          <div className="cal-detail-title">
            <span className={`cal-pill ${selectedEntry.kind}-${selectedEntry.colorState}`} />
            <h4>
              {selectedEntry.timeLabel} &middot; {selectedEntry.title}
            </h4>
          </div>

          <div className="cal-detail-pills">
            <span className="status-pill outline">
              {selectedEntry.kind === "consultation" ? "Consultation" : "Session"}
            </span>
            <StatusPill value={selectedEntry.status} />
            {selectedEntry.outcome && <StatusPill value={selectedEntry.outcome} prefix="Outcome:" />}
            {selectedEntry.payment && (
              <span className={`status-pill ${selectedEntry.status === "pending_payment" ? "brass" : "teal"}`}>
                {selectedEntry.payment}
              </span>
            )}
          </div>

          <dl className="cal-detail-facts">
            {selectedEntry.clientEmail && (
              <>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${selectedEntry.clientEmail}`}>{selectedEntry.clientEmail}</a>
                </dd>
              </>
            )}
            {selectedEntry.clientPhone && (
              <>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${selectedEntry.clientPhone}`}>{selectedEntry.clientPhone}</a>
                </dd>
              </>
            )}
            {selectedEntry.subject && (
              <>
                <dt>Subject</dt>
                <dd>{selectedEntry.subject}</dd>
              </>
            )}
            {selectedEntry.notes && (
              <>
                <dt>Notes</dt>
                <dd>{selectedEntry.notes}</dd>
              </>
            )}
            {selectedEntry.kind === "consultation" && selectedEntry.scriptUrl && (
              <>
                <dt>Script</dt>
                <dd>
                  <a href={selectedEntry.scriptUrl} target="_blank" rel="noreferrer">
                    Open call script
                  </a>
                </dd>
              </>
            )}
          </dl>

          <div className="cal-action-row">
            {selectedEntry.roomHref && selectedEntry.status === "scheduled" && (
              <Link href={selectedEntry.roomHref} className="btn btn-auto">
                Open room
              </Link>
            )}

            {selectedEntry.meetingHref && selectedEntry.status === "scheduled" && (
              <a href={selectedEntry.meetingHref} target="_blank" rel="noopener noreferrer" className="btn btn-auto">
                Join call
              </a>
            )}

            {selectedEntry.clientHref && (
              <Link href={selectedEntry.clientHref} className="btn btn-secondary btn-auto">
                View client
              </Link>
            )}

            {selectedEntry.kind === "consultation" &&
              selectedEntry.status === "scheduled" &&
              selectedEntry.outcome === "pending" && (
                <>
                  <form
                    action={`/api/consultations/${selectedEntry.id}/outcome?next=${encodeURIComponent(returnTo)}`}
                    method="post"
                  >
                    <input type="hidden" name="outcome" value="good_fit" />
                    <button className="btn btn-auto" type="submit">
                      Good fit
                    </button>
                  </form>
                  <form
                    action={`/api/consultations/${selectedEntry.id}/outcome?next=${encodeURIComponent(returnTo)}`}
                    method="post"
                  >
                    <input type="hidden" name="outcome" value="not_a_fit" />
                    <button className="btn btn-secondary btn-auto" type="submit">
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
                <button className="btn btn-danger btn-auto" type="submit">
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
                  <button className="btn btn-danger btn-auto" type="submit">
                    Cancel
                  </button>
                </form>
              )}
          </div>
        </div>
      )}

      <section className="agenda">
        <h3>Coming up</h3>
        {upcomingDays.length === 0 && <p className="empty-state">Nothing booked for the rest of these four weeks.</p>}
        {upcomingDays.map((day) => (
          <div className="agenda-day" key={day.dateKey}>
            <div className="agenda-date">
              <span className="agenda-weekday">{day.weekdayLabel}</span>
              <span className="agenda-daynum">{day.dayNumber}</span>
              <span className="agenda-month">{day.monthLabel}</span>
            </div>
            <div className="agenda-entries">
              {day.entries
                .filter((e) => e.colorState === "upcoming")
                .map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    className="cal-entry-row"
                    onClick={() => openEntry(day.dateKey, entry.id)}
                  >
                    <span className={`cal-pill ${entry.kind}-${entry.colorState}`} />
                    <span className="cal-entry-main">
                      <strong>{entry.timeLabel}</strong> &middot; {entry.title}
                    </span>
                    <span className="cal-entry-chevron" aria-hidden="true">
                      &rsaquo;
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
