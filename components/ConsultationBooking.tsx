"use client";

import { useEffect, useState } from "react";

type SlotsResponse = {
  slots: string[];
  timezone: string;
  durationMinutes: number;
};

function groupByDay(slots: string[], timezone: string) {
  const groups = new Map<string, string[]>();
  for (const iso of slots) {
    const date = new Date(iso);
    const key = date.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(iso);
  }
  return Array.from(groups.entries());
}

export default function ConsultationBooking() {
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error" | "done">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSlots() {
    try {
      const res = await fetch("/api/consultations/slots");
      if (!res.ok) throw new Error("failed");
      const json: SlotsResponse = await res.json();
      setData(json);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setStatus("submitting");
    setErrorMessage("");

    const res = await fetch("/api/consultations/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        email,
        phone,
        subject,
        scheduledAt: selected,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(json.error ?? "Something went wrong. Please try again.");
      if (res.status === 409) {
        setSelected(null);
        loadSlots();
      }
      return;
    }

    setStatus("done");
  }

  if (status === "done") {
    return (
      <p className="notice success">
        You&apos;re booked! Check your email for the details.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="notice error">
        Couldn&apos;t load available times right now. Please email
        ed@leggtutoring.com to set up a call.
      </p>
    );
  }

  if (!data) {
    return <p className="notice">Loading available times&hellip;</p>;
  }

  if (data.slots.length === 0) {
    return (
      <p className="notice">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut labore et dolore magna aliqua.
      </p>
    );
  }

  const days = groupByDay(data.slots, data.timezone);

  return (
    <div className="slot-picker">
      {!selected ? (
        <div className="slot-days">
          {days.map(([day, isoSlots]) => (
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
      ) : (
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
            &middot; {data.durationMinutes} min &middot;{" "}
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
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="fullName">Name</label>
              <input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone (optional)</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="subject">What do you need help with?</label>
              <input
                id="subject"
                placeholder="e.g. Algebra 2, Calculus AB, SAT math"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <button className="btn" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Booking..." : "Confirm free consultation"}
            </button>
          </form>
          {status === "error" && <p className="notice error">{errorMessage}</p>}
        </>
      )}
    </div>
  );
}
