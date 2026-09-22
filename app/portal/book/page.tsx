"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookSessionPage() {
  const router = useRouter();
  const [type, setType] = useState<"virtual" | "in_person">("virtual");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const res = await fetch("/api/sessions/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        scheduledAt,
        durationMinutes,
        location: type === "in_person" ? location : undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus("error");
      setErrorMessage(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
      return;
    }

    router.push("/portal");
  }

  return (
    <div className="portal-shell wrap" style={{ display: "flex" }}>
      <div className="portal-card" style={{ maxWidth: 520 }}>
        <h1>Book a session</h1>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="type">Session type</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as "virtual" | "in_person")}
            >
              <option value="virtual">Virtual (paid at booking)</option>
              <option value="in_person">In-person, Roanoke area (pay after)</option>
            </select>
          </div>

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

          {type === "in_person" && (
            <div className="field">
              <label htmlFor="location">Where should we meet?</label>
              <input
                id="location"
                type="text"
                required
                placeholder="e.g. Roanoke Public Library, Main Branch"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          <button className="btn" type="submit" disabled={status === "submitting"}>
            {status === "submitting"
              ? "Working..."
              : type === "virtual"
              ? "Continue to payment"
              : "Book session"}
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
