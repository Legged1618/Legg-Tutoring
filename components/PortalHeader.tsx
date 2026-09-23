"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PortalHeader() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header>
      <nav className="nav" style={{ justifyContent: "space-between" }}>
        <Link href="/" className="wordmark">
          Legg Tutoring
        </Link>
        <div className="nav-links">
          <Link href="/portal">My sessions</Link>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              font: "inherit",
              color: "inherit",
              cursor: "pointer",
              padding: 0,
              textDecoration: "underline",
            }}
          >
            Log out
          </button>
        </div>
      </nav>
    </header>
  );
}
