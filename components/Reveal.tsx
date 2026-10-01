"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades and lifts its children in the first time they scroll into view.
 * Content is visible without JavaScript, and with reduced motion the CSS
 * skips the animation.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  /** Milliseconds, for staggering cards in a row. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<"static" | "waiting" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    // Already on screen at load: leave it alone rather than flash it.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setState("waiting");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`${className} reveal${state === "waiting" ? " reveal-waiting" : ""}${
        state === "shown" ? " reveal-shown" : ""
      }`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
