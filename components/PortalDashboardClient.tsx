"use client";

import { useState } from "react";
import SessionBooking from "@/components/SessionBooking";

type SessionRow = {
  id: string;
  type: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  status: string;
};

export default function PortalDashboardClient({
  approved,
  sessions,
  bookedBanner,
}: {
  approved: boolean;
  sessions: SessionRow[];
  bookedBanner: boolean;
}) {
  const [view, setView] = useState<"list" | "booking">("list");

  return (
    <div className="slide-viewport">
      <div className={`slide-track${view === "booking" ? " showing-booking" : ""}`}>
        <div className="slide-panel">
          {bookedBanner && (
            <p className="notice success" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
              Payment received &mdash; your session is booked!
            </p>
          )}

          {!approved && (
            <p className="notice" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua.
            </p>
          )}

          {approved && (
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <button
                type="button"
                className="btn"
                style={{ maxWidth: 260, margin: "0 auto" }}
                onClick={() => setView("booking")}
              >
                Book a session
              </button>
            </div>
          )}

          <div className="session-list">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div className="session-row" key={s.id}>
                  <div>
                    <strong>{s.type === "virtual" ? "Virtual session" : "In-person session"}</strong>
                    <div className="meta">
                      {new Date(s.scheduled_at).toLocaleString()} &middot; {s.duration_minutes} min
                      {s.location ? ` · ${s.location}` : ""}
                    </div>
                    <div className="meta">Status: {s.status.replaceAll("_", " ")}</div>
                  </div>
                  {(s.status === "scheduled" || s.status === "pending_payment") && (
                    <form action={`/api/sessions/${s.id}/cancel`} method="post">
                      <button className="btn btn-secondary" type="submit">
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              ))
            ) : (
              <p className="notice">No sessions yet.</p>
            )}
          </div>

          <p className="policy-note">
            Cancel 24+ hours before your session for a full refund. Cancelling inside 24 hours
            applies a flat $10 fee to the refund. If your tutor cancels, you&apos;re refunded in
            full automatically.
          </p>
        </div>

        <div className="slide-panel">
          <button
            type="button"
            onClick={() => setView("list")}
            style={{
              background: "none",
              border: "none",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              textDecoration: "underline",
              marginBottom: 20,
              display: "inline-block",
            }}
          >
            &larr; Back to your sessions
          </button>
          <div className="portal-card" style={{ maxWidth: 520, margin: "0 auto" }}>
            <h1>Book a session</h1>
            <SessionBooking />
            <p className="policy-note">
              $65/hour, virtual only. Payment is collected now, before the session. Cancel 24+
              hours out for a full refund; inside 24 hours a flat $10 fee applies. If your tutor
              cancels, you&apos;re refunded in full automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
