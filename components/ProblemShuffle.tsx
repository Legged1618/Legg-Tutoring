"use client";

import { useEffect, useState } from "react";

/**
 * Hero illustration: a stack of three worked problems drawn from a larger
 * bank. The front card writes out its solution one step at a time, then
 * goes back into the bank and a random problem joins the back of the stack.
 */

type Problem = {
  topic: string;
  level: string;
  prompt: string;
  steps: string[];
  answer: string;
  figure?: "triangle" | "line";
};

const PROBLEMS: Problem[] = [
  {
    topic: "Algebra",
    level: "Middle school",
    prompt: "Solve for x:  2x + 3 = 11",
    steps: ["2x + 3 − 3 = 11 − 3", "2x = 8", "2x ÷ 2 = 8 ÷ 2"],
    answer: "x = 4",
  },
  {
    topic: "Geometry",
    level: "High school",
    prompt: "Find the missing side c.",
    steps: ["a² + b² = c²", "3² + 4² = c²", "9 + 16 = 25 = c²"],
    answer: "c = 5",
    figure: "triangle",
  },
  {
    topic: "Fractions",
    level: "Middle school",
    prompt: "Add:  1/2 + 1/3",
    steps: ["Common denominator: 6", "1/2 = 3/6  and  1/3 = 2/6", "3/6 + 2/6"],
    answer: "= 5/6",
  },
  {
    topic: "Graphing",
    level: "High school",
    prompt: "Slope through (1, 2) and (3, 6)",
    steps: ["m = (y₂ − y₁) / (x₂ − x₁)", "m = (6 − 2) / (3 − 1)", "m = 4 / 2"],
    answer: "m = 2",
    figure: "line",
  },
  {
    topic: "Percents",
    level: "Middle school",
    prompt: "What is 15% of 80?",
    steps: ["15% = 0.15", "0.15 × 80"],
    answer: "= 12",
  },
  {
    topic: "Order of operations",
    level: "Middle school",
    prompt: "Simplify:  3 + 4 × 2²",
    steps: ["Exponent first: 2² = 4", "3 + 4 × 4", "3 + 16"],
    answer: "= 19",
  },
  {
    topic: "Quadratics",
    level: "High school",
    prompt: "Solve:  x² − 4x + 3 = 0",
    steps: ["(x − 1)(x − 3) = 0", "x − 1 = 0  or  x − 3 = 0"],
    answer: "x = 1 or x = 3",
  },
  {
    topic: "Systems",
    level: "High school",
    prompt: "x + y = 10  and  x − y = 4",
    steps: ["Add the equations: 2x = 14", "x = 7", "7 + y = 10"],
    answer: "x = 7, y = 3",
  },
  {
    topic: "Proportions",
    level: "Middle school",
    prompt: "Solve:  3/4 = x/20",
    steps: ["Cross multiply: 4x = 3 · 20", "4x = 60"],
    answer: "x = 15",
  },
  {
    topic: "Circles",
    level: "High school",
    prompt: "Area of a circle with radius 3",
    steps: ["A = πr²", "A = π · 3²"],
    answer: "A = 9π ≈ 28.3",
  },
  {
    topic: "Calculus",
    level: "College",
    prompt: "Differentiate:  x³ + 2x",
    steps: ["Power rule: d/dx xⁿ = nxⁿ⁻¹", "3x² + 2 · 1"],
    answer: "= 3x² + 2",
  },
  {
    topic: "Statistics",
    level: "College",
    prompt: "Mean of 4, 7, 9, 10",
    steps: ["Sum: 4 + 7 + 9 + 10 = 30", "30 ÷ 4"],
    answer: "= 7.5",
  },
];

const VISIBLE = 3;
const CARD_MS = 5200;

/** Moves the front problem back into the bank and draws a new one at random. */
function advance(queue: number[]): number[] {
  const [front, ...rest] = queue;
  const offDeck = rest.length - (VISIBLE - 1);
  const pick = VISIBLE - 1 + Math.floor(Math.random() * Math.max(offDeck, 1));
  const next = [...rest];
  const [drawn] = next.splice(pick, 1);
  next.splice(VISIBLE - 1, 0, drawn);
  next.push(front);
  return next;
}

function shuffled(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function ProblemShuffle() {
  // Fixed order on the server, shuffled once the page loads.
  const [queue, setQueue] = useState(() => PROBLEMS.map((_, i) => i));
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setQueue(shuffled(PROBLEMS.length));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;
    const t = window.setInterval(() => setQueue(advance), CARD_MS);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="hero-art problem-stack" aria-hidden="true">
      <span className="hero-blob hero-blob-teal" />
      <span className="hero-blob hero-blob-brass" />
      {PROBLEMS.map((p, i) => {
        const pos = Math.min(queue.indexOf(i), VISIBLE);
        return (
          <div
            key={p.prompt}
            className={`problem-card pos-${pos}${pos === 0 ? " is-front" : ""}${reduced ? " still" : ""}`}
          >
            <div className="problem-head">
              <span className="problem-topic">{p.topic}</span>
              <span className="problem-count">{p.level}</span>
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
