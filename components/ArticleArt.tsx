/**
 * Preview illustrations for the "Worth a Look" article cards. Drawn as SVG
 * so they stay sharp, match the site colors, and need no outside images.
 */
export type ArticleArtKind = "mindset" | "study" | "graph" | "practice" | "geometry" | "recall";

const BG: Record<ArticleArtKind, [string, string]> = {
  mindset: ["#3E6C70", "#6E9A9C"],
  study: ["#A9762E", "#D4A45E"],
  graph: ["#1D2733", "#42566B"],
  practice: ["#2F5558", "#3E6C70"],
  geometry: ["#8C5F22", "#A9762E"],
  recall: ["#2A3846", "#52616F"],
};

export default function ArticleArt({ kind }: { kind: ArticleArtKind }) {
  const [a, b] = BG[kind];
  const id = `art-${kind}`;
  return (
    <svg className="article-art" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="320" height="150" fill={`url(#${id})`} />
      <g fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1">
        {[30, 60, 90, 120].map((y) => (
          <line key={y} x1="0" x2="320" y1={y} y2={y} />
        ))}
        {[40, 80, 120, 160, 200, 240, 280].map((x) => (
          <line key={x} y1="0" y2="150" x1={x} x2={x} />
        ))}
      </g>
      {kind === "mindset" && <Mindset />}
      {kind === "study" && <Study />}
      {kind === "graph" && <Graph />}
      {kind === "practice" && <Practice />}
      {kind === "geometry" && <Geometry />}
      {kind === "recall" && <Recall />}
    </svg>
  );
}

const W = "#F7F3EA";
const GOLD = "#F0D49A";

function Mindset() {
  // Rising staircase of effort with an upward trend line.
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={70 + i * 38} y={110 - i * 16} width="30" height={16 + i * 16} rx="4" fill="rgba(247,243,234,0.85)" />
      ))}
      <path d="M60 112 C 120 100, 180 70, 268 30" stroke={GOLD} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M256 26 l14 2 -6 13" stroke={GOLD} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Study() {
  // A week calendar with spaced practice days ticked.
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const ticked = [0, 2, 5];
  return (
    <g fontFamily="IBM Plex Sans, sans-serif" fontSize="11" fontWeight="600">
      <rect x="56" y="28" width="208" height="96" rx="10" fill={W} />
      <rect x="56" y="28" width="208" height="22" rx="10" fill="#1D2733" />
      <rect x="56" y="40" width="208" height="10" fill="#1D2733" />
      {days.map((d, i) => (
        <g key={i}>
          <text x={74 + i * 28} y="43" fill={W} textAnchor="middle">
            {d}
          </text>
          <circle cx={74 + i * 28} cy="84" r="10" fill={ticked.includes(i) ? "#3E6C70" : "#E6DFCF"} />
          {ticked.includes(i) && (
            <path d={`M${69 + i * 28} 84 l4 4 7-8`} stroke={W} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      ))}
      <path d="M74 106 Q 116 118 130 106 T 214 106" stroke="#A9762E" strokeWidth="2" fill="none" strokeDasharray="4 4" />
    </g>
  );
}

function Graph() {
  // Two curves on axes, like a graphing calculator.
  return (
    <g>
      <line x1="40" x2="290" y1="100" y2="100" stroke="rgba(247,243,234,0.6)" strokeWidth="1.5" />
      <line x1="160" x2="160" y1="16" y2="138" stroke="rgba(247,243,234,0.6)" strokeWidth="1.5" />
      <path d="M60 20 Q 160 180 260 20" stroke="#8FC1C4" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M40 120 C 100 120, 120 60, 160 60 S 220 0, 290 0" stroke={GOLD} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="113" cy="77" r="5" fill={W} />
      <circle cx="208" cy="77" r="5" fill={W} />
    </g>
  );
}

function Practice() {
  // A practice set with progress bars and checks.
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx="78" cy={45 + i * 32} r="11" fill={i < 2 ? GOLD : "rgba(247,243,234,0.3)"} />
          {i < 2 && (
            <path d={`M72 ${45 + i * 32} l4 4 8-8`} stroke="#2F5558" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
          <rect x="100" y={39 + i * 32} width="160" height="12" rx="6" fill="rgba(247,243,234,0.25)" />
          <rect x="100" y={39 + i * 32} width={[160, 120, 50][i]} height="12" rx="6" fill={W} />
        </g>
      ))}
    </g>
  );
}

function Geometry() {
  // A triangle inscribed in a circle, with draggable-looking points.
  return (
    <g>
      <circle cx="160" cy="76" r="54" stroke="rgba(247,243,234,0.75)" strokeWidth="2.5" fill="none" />
      <path d="M112 100 L 196 36 L 208 98 Z" stroke={W} strokeWidth="3" fill="rgba(247,243,234,0.15)" strokeLinejoin="round" />
      <path d="M196 54 a 18 18 0 0 1 9 -2" stroke={GOLD} strokeWidth="2.5" fill="none" />
      {[
        [112, 100],
        [196, 36],
        [208, 98],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill={GOLD} stroke="#8C5F22" strokeWidth="2" />
      ))}
    </g>
  );
}

function Recall() {
  // Stacked flashcards, the top one flipped to a question.
  return (
    <g fontFamily="Spectral, serif">
      <rect x="92" y="40" width="150" height="86" rx="10" fill="rgba(247,243,234,0.35)" transform="rotate(-8 167 83)" />
      <rect x="86" y="34" width="150" height="86" rx="10" fill="rgba(247,243,234,0.6)" transform="rotate(4 161 77)" />
      <rect x="84" y="30" width="152" height="88" rx="10" fill={W} />
      <text x="160" y="72" fontSize="22" fill="#1D2733" textAnchor="middle">
        sin²θ + cos²θ
      </text>
      <text x="160" y="100" fontSize="18" fill="#A9762E" textAnchor="middle">
        = ?
      </text>
    </g>
  );
}
