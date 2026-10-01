"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HeroSlide = {
  id: string;
  /** Short name for the dot buttons, e.g. "Pricing". */
  label: string;
  content: React.ReactNode;
};

const INTERVAL_MS = 7000;

/**
 * The homepage's first screen: a few slides that preview what's further
 * down. Advances on its own every few seconds, pauses while hovered or
 * focused, and never auto-advances for people who prefer reduced motion.
 * Arrows, dots, arrow keys and swipes all work.
 */
export default function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, reducedMotion, count, go]);

  return (
    <div
      className={`slideshow${paused ? " is-paused" : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="slides">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`slide-item${i === index ? " active" : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}: ${slide.label}`}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className="slide-controls">
          <button type="button" className="slide-arrow" onClick={() => go(index - 1)} aria-label="Previous slide">
            &larr;
          </button>
          <div className="slide-dots">
            {slides.map((slide, i) => (
              <button
                type="button"
                key={slide.id}
                className={`slide-dot${i === index ? " active" : ""}`}
                onClick={() => go(i)}
                aria-label={`Show ${slide.label}`}
                aria-current={i === index}
              >
                <span className="slide-dot-label">{slide.label}</span>
                {i === index && !paused && !reducedMotion && (
                  <span className="slide-dot-progress" style={{ animationDuration: `${INTERVAL_MS}ms` }} />
                )}
              </button>
            ))}
          </div>
          <button type="button" className="slide-arrow" onClick={() => go(index + 1)} aria-label="Next slide">
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
