"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Generic fade-in-on-mount wrapper. Keying by the full path+query makes
 * React treat every navigation as a fresh mount -- including query-only
 * changes like calendar paging (?start=...), which a pathname-only key
 * would miss entirely. Reuse the same `.page-fade` class directly (no
 * remount needed) anywhere else that should fade in, e.g. landing-page
 * sections later.
 *
 * Opacity-only on purpose: a `transform` here would give header's
 * position: fixed a new containing block and un-stick it from the
 * viewport.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  return (
    <div key={key} className="page-fade">
      {children}
    </div>
  );
}
