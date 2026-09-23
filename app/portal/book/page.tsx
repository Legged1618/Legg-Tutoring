"use client";

import { useState } from "react";

export default function BookSessionPage() {
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const res = await fetch("/api/sessions/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt, durationMinutes }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    window.location.href = data.checkoutUrl;
  }

  return (
    <div className="portal-shell wrap" style={{ display: "flex" }}>
      <div className="portal-card" style={{ maxWidth: 520 }}>
        <h1>Book a session</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="scheduledAt">Date &amp; time</label>
            <input
              id="scheduledAt"
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="duration">Duration (minutes)</label>
            <select
              id="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            >
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
            </select>
          </div>

          <button className="btn" type="submit" disabled={status === "submitting"}>
            {status === "submitting" ? "Working..." : "Continue to payment"}
          </button>
        </form>

        {status === "error" && <p className="notice error">{errorMessage}</p>}

        <p className="policy-note">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat.
        </p>
      </div>
    </div>
  );
}
