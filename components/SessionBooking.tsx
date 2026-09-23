"use client";

import { useEffect, useState } from "react";
import { groupSlotsByDay } from "@/lib/slotDisplay";

const DURATIONS = [30, 60, 120] as const;

type SlotsResponse = {
  slots: string[];
  timezone: string;
  durationMinutes: number;
};

export default function SessionBooking() {
  const [durationMinutes, setDurationMinutes] = useState<(typeof DURATIONS)[number]>(60);
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSlots(duration: number) {
    setData(null);
    setSelected(null);
    try {
      const res = await fetch(`/api/sessions/slots?duration=${duration}`);
      if (!res.ok) throw new Error("failed");
      const json: SlotsResponse = await res.json();
      setData(json);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }

  useEffect(() => {
    loadSlots(durationMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMinutes]);

  async function handleConfirm() {
    if (!selected) return;
    setStatus("submitting");
    setErrorMessage("");

    const res = await fetch("/api/sessions/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: selected, durationMinutes }),
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(json.error ?? "Something went wrong. Please try again.");
      if (res.status === 409) {
        setSelected(null);
        loadSlots(durationMinutes);
      }
      return;
    }

    window.location.href = json.checkoutUrl;
  }

  return (
    <div className="slot-picker">
      <div className="field">
        <label htmlFor="duration">Session length</label>
        <select
          id="duration"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value) as (typeof DURATIONS)[number])}
        >
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
        </select>
      </div>

      {loadError && (
        <p className="notice error">
          Couldn&apos;t load available times right now. Try refreshing the page.
        </p>
      )}

      {!loadError && !data && <p className="notice">Loading available times&hellip;</p>}

      {!loadError && data && data.slots.length === 0 && (
        <p className="notice">
          No open times for that length in the next couple weeks &mdash; try a shorter session or
          check back soon.
        </p>
      )}

      {!loadError && data && data.slots.length > 0 && !selected && (
        <div className="slot-days">
          {groupSlotsByDay(data.slots, data.timezone).map(([day, isoSlots]) => (
            <div className="slot-day" key={day}>
              <h4>{day}</h4>
              <div className="slot-buttons">
                {isoSlots.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    className="slot-btn"
                    onClick={() => setSelected(iso)}
                  >
                    {new Date(iso).toLocaleTimeString("en-US", {
                      timeZone: data.timezone,
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && selected && (
        <>
          <p className="notice" style={{ textAlign: "left", marginBottom: 14 }}>
            {new Date(selected).toLocaleString("en-US", {
              timeZone: data.timezone,
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            })}{" "}
            &middot; {durationMinutes} min &middot;{" "}
            <button
              type="button"
              onClick={() => setSelected(null)}
              style={{
                background: "none",
                border: "none",
                textDecoration: "underline",
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                padding: 0,
              }}
            >
              change time
            </button>
          </p>
          <button
            className="btn"
            type="button"
            onClick={handleConfirm}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Working..." : "Continue to payment"}
          </button>
          {status === "error" && <p className="notice error">{errorMessage}</p>}
        </>
      )}
    </div>
  );
}
