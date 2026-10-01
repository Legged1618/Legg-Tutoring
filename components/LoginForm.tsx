"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
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
    <div className="portal-card">
      <h1>Client Portal</h1>
      <p className="notice">
        Enter your email to receive a one-time login link.
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
  );
}
