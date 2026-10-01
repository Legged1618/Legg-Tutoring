"use client";

import { useEffect, useState } from "react";

/**
 * Hero illustration: a small stack of worked problems. The front card writes
 * out its solution one step at a time, then moves to the back of the stack
 * and the next problem comes forward.
 */

type Problem = {
  topic: string;
  prompt: string;
  steps: string[];
  answer: string;
  figure?: "triangle" | "line";
};

const PROBLEMS: Problem[] = [
  {
    topic: "Algebra",
    prompt: "Solve for x:  2x + 3 = 11",
    steps: ["2x + 3 − 3 = 11 − 3", "2x = 8", "2x ÷ 2 = 8 ÷ 2"],
    answer: "x = 4",
  },
  {
    topic: "Geometry",
    prompt: "Find the missing side c.",
    steps: ["a² + b² = c²", "3² + 4² = c²", "9 + 16 = 25 = c²"],
    answer: "c = 5",
    figure: "triangle",
  },
  {
    topic: "Fractions",
    prompt: "Add:  1/2 + 1/3",
    steps: ["Common denominator: 6", "1/2 = 3/6  and  1/3 = 2/6", "3/6 + 2/6"],
    answer: "= 5/6",
  },
  {
    topic: "Graphing",
    prompt: "Slope through (1, 2) and (3, 6)",
    steps: ["m = (y₂ − y₁) / (x₂ − x₁)", "m = (6 − 2) / (3 − 1)", "m = 4 / 2"],
    answer: "m = 2",
    figure: "line",
  },
];

const CARD_MS = 5200;

export default function ProblemShuffle() {
  const [front, setFront] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    const t = window.setInterval(() => setFront((f) => (f + 1) % PROBLEMS.length), CARD_MS);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="hero-art problem-stack" aria-hidden="true">
      <span className="hero-blob hero-blob-teal" />
      <span className="hero-blob hero-blob-brass" />
      {PROBLEMS.map((p, i) => {
        const pos = (i - front + PROBLEMS.length) % PROBLEMS.length;
        return (
          <div
            key={p.prompt}
            className={`problem-card pos-${pos}${pos === 0 ? " is-front" : ""}${reduced ? " still" : ""}`}
          >
            <div className="problem-head">
              <span className="problem-topic">{p.topic}</span>
              <span className="problem-count">
                {i + 1} / {PROBLEMS.length}
              </span>
            </div>
            <p className="problem-prompt">{p.prompt}</p>
            <div className="problem-body">
              <ol className="problem-steps">
                {p.steps.map((s, k) => (
                  <li key={s} style={{ animationDelay: `${400 + k * 700}ms` }}>
                    {s}
                  </li>
                ))}
                <li className="problem-answer" style={{ animationDelay: `${400 + p.steps.length * 700}ms` }}>
                  {p.answer}
                </li>
              </ol>
              {p.figure === "triangle" && (
                <svg className="problem-figure" viewBox="0 0 100 80">
                  <path d="M12 68 H72 V20 Z" fill="rgba(62,108,112,0.12)" stroke="#1D2733" strokeWidth="2" />
                  <path d="M64 68 V60 H72" fill="none" stroke="#1D2733" strokeWidth="1.4" />
                  <text x="38" y="78" fontSize="10">a = 4</text>
                  <text x="76" y="48" fontSize="10">b = 3</text>
                  <text x="22" y="38" fontSize="10" fill="#A9762E">c</text>
                </svg>
              )}
              {p.figure === "line" && (
                <svg className="problem-figure" viewBox="0 0 100 80">
                  <g stroke="#E3DCCB">
                    {[20, 40, 60, 80].map((v) => (
                      <line key={`x${v}`} x1={v} x2={v} y1="4" y2="72" />
                    ))}
                    {[16, 32, 48, 64].map((v) => (
                      <line key={`y${v}`} y1={v} y2={v} x1="4" x2="96" />
                    ))}
                  </g>
                  <path d="M8 72 H96 M8 72 V4" stroke="#52616F" strokeWidth="1.4" fill="none" />
                  <path d="M10 70 L80 8" stroke="#3E6C70" strokeWidth="2.4" />
                  <circle cx="30" cy="52" r="3.5" fill="#A9762E" />
                  <circle cx="60" cy="26" r="3.5" fill="#A9762E" />
                </svg>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
