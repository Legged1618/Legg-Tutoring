"use client";

import { usePathname } from "next/navigation";

/**
 * Generic fade-in-on-mount wrapper. Keying by pathname makes React treat
 * each route as a fresh mount, so it re-fades on every navigation -- reuse
 * the same `.page-fade` class directly (no remount needed) anywhere else
 * that should fade in, e.g. landing-page sections later.
 *
 * Opacity-only on purpose: a `transform` here would give headers.position:
 * fixed a new containing block and un-stick them from the viewport.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  );
}
