"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-fetches the current page's server data every few seconds while the tab
 * is visible, so new messages and bookings show up without a reload.
 * Typed-but-unsent text survives: refresh() keeps client state and
 * uncontrolled inputs as they are.
 */
export default function LiveRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, seconds * 1000);
    // Catch up right away when coming back to the tab.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, seconds]);

  return null;
}
