"use client";

import { useEffect, useRef } from "react";

/** Keeps a message list scrolled to the newest message, including after live refreshes. */
export default function ThreadScroller({ count, children }: { count: number; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);
  return (
    <div className="message-list" ref={ref}>
      {children}
    </div>
  );
}
