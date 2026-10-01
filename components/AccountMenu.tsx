"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AccountMenu({
  email,
  displayName,
  isTutor,
}: {
  email: string;
  displayName: string;
  isTutor: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const initial = (displayName || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className="account-avatar"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {initial}
      </button>

      {open && (
        <div className="account-dropdown">
          <div className="account-dropdown-header">
            <strong>{displayName || (isTutor ? "Admin" : "Account")}</strong>
            <span>{email}</span>
          </div>

          <div className="account-dropdown-links">
            {isTutor ? (
              <Link href="/portal/admin" onClick={() => setOpen(false)}>
                Admin portal
              </Link>
            ) : (
              <>
                <Link href="/portal" onClick={() => setOpen(false)}>
                  My sessions
                </Link>
                <Link href="/portal/messages" onClick={() => setOpen(false)}>
                  Messages
                </Link>
              </>
            )}
            <Link href="/portal/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
            <button type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
