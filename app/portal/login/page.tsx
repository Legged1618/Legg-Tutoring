"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <div className="portal-shell wrap" style={{ display: "flex" }}>
      <div className="portal-card">
        <h1>Client Portal</h1>
        <p className="notice">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <form onSubmit={handleSubmit} style={{ marginTop: 22 }}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <button className="btn" type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send sign-in link"}
          </button>
        </form>
        {status === "sent" && (
          <p className="notice success">Check your email for the sign-in link.</p>
        )}
        {status === "error" && (
          <p className="notice error">
            Something went wrong sending the link. Try again in a moment.
          </p>
        )}
      </div>
    </div>
  );
}
