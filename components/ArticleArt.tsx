/**
 * Preview images for the "Worth a Look" cards. Each one is a small drawing of
 * the site it links to, inside a browser window with that site's address, so
 * visitors can tell at a glance where the link goes. Drawn as SVG so they stay
 * sharp and need no outside images.
 */
export type ArticleArtKind = "youcubed" | "learningscientists" | "desmos" | "khan" | "geogebra" | "retrieval";

const DOMAIN: Record<ArticleArtKind, string> = {
  youcubed: "youcubed.org",
  learningscientists: "learningscientists.org",
  desmos: "desmos.com/calculator",
  khan: "khanacademy.org/math",
  geogebra: "geogebra.org",
  retrieval: "retrievalpractice.org",
};

const BACKDROP: Record<ArticleArtKind, [string, string]> = {
  youcubed: ["#3E6C70", "#6E9A9C"],
  learningscientists: ["#A9762E", "#D4A45E"],
  desmos: ["#1D2733", "#42566B"],
  khan: ["#2F5558", "#3E6C70"],
  geogebra: ["#8C5F22", "#A9762E"],
  retrieval: ["#2A3846", "#52616F"],
};

const SANS = "IBM Plex Sans, Helvetica, Arial, sans-serif";
const INK = "#1D2733";
const SOFT = "#8A96A3";
const LINE = "#E3E7EB";

export default function ArticleArt({ kind }: { kind: ArticleArtKind }) {
  const [a, b] = BACKDROP[kind];
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
      {/* Browser window */}
      <g transform="translate(22 14)">
        <rect width="276" height="150" rx="8" fill="#FFFFFF" />
        <rect width="276" height="20" rx="8" fill="#EEF0F2" />
        <rect y="12" width="276" height="8" fill="#EEF0F2" />
        <circle cx="10" cy="10" r="2.6" fill="#E0857A" />
        <circle cx="19" cy="10" r="2.6" fill="#E6C16A" />
        <circle cx="28" cy="10" r="2.6" fill="#8CC08A" />
        <rect x="40" y="4.5" width="196" height="11" rx="5.5" fill="#FFFFFF" />
        <text x="48" y="12.8" fontFamily={SANS} fontSize="7" fill="#52616F">
          {DOMAIN[kind]}
        </text>
        <g transform="translate(0 20)">
          {kind === "youcubed" && <Youcubed />}
          {kind === "learningscientists" && <LearningScientists />}
          {kind === "desmos" && <Desmos />}
          {kind === "khan" && <Khan />}
          {kind === "geogebra" && <GeoGebra />}
          {kind === "retrieval" && <Retrieval />}
        </g>
      </g>
    </svg>
  );
}

function Youcubed() {
  // A "number talk" dot picture: how many dots, and how do you see them?
  const dots: [number, number][] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) dots.push([150 + c * 16 + (c > 2 ? 8 : 0), 38 + r * 16]);
  return (
    <g fontFamily={SANS}>
      <text x="14" y="22" fontSize="11" fontWeight="700" fill={INK}>
        Number talks
      </text>
      <text x="14" y="38" fontSize="7.5" fill={SOFT}>
        How many dots do you see?
      </text>
      <text x="14" y="50" fontSize="7.5" fill={SOFT}>
        How did you see them?
      </text>
      <rect x="14" y="62" width="58" height="14" rx="7" fill="#6C4BA6" />
      <text x="25" y="71.5" fontSize="7" fill="#FFFFFF" fontWeight="600">
        Try one
      </text>
      <rect x="138" y="26" width="118" height="56" rx="6" fill="#F4F0FA" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill={i % 6 < 3 ? "#6C4BA6" : "#E58A3A"} />
      ))}
      <text x="160" y="96" fontSize="7" fill={SOFT}>
        3 × 6 = 18 · 9 + 9 = 18
      </text>
    </g>
  );
}

function LearningScientists() {
  // The six strategies for effective learning, as tiles.
  const tiles = ["Spaced practice", "Retrieval practice", "Elaboration", "Interleaving", "Concrete examples", "Dual coding"];
  const colors = ["#3E6C70", "#A9762E", "#6C4BA6", "#C2554B", "#2D70B3", "#388C46"];
  return (
    <g fontFamily={SANS}>
      <text x="14" y="18" fontSize="10" fontWeight="700" fill={INK}>
        Six strategies for effective learning
      </text>
      {tiles.map((t, i) => {
        const x = 14 + (i % 3) * 84;
        const y = 28 + Math.floor(i / 3) * 42;
        return (
          <g key={t}>
            <rect x={x} y={y} width="78" height="36" rx="5" fill="#F7F5F0" stroke={LINE} />
            <circle cx={x + 13} cy={y + 13} r="7" fill={colors[i]} />
            <text x={x + 10.2} y={y + 15.8} fontSize="7.5" fill="#FFFFFF" fontWeight="700">
              {i + 1}
            </text>
            <text x={x + 6} y={y + 30} fontSize="6.6" fill={INK}>
              {t}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Desmos() {
  // Expression list on the left, the graph on the right.
  const RED = "#C74440";
  const BLUE = "#2D70B3";
  return (
    <g fontFamily={SANS}>
      <rect width="92" height="130" fill="#FFFFFF" />
      <line x1="92" x2="92" y1="0" y2="130" stroke={LINE} />
      {[
        { y: 0, color: RED, text: "y = x² − 2" },
        { y: 28, color: BLUE, text: "y = 0.5x + 1" },
      ].map((row) => (
        <g key={row.text}>
          <rect y={row.y} width="92" height="28" fill="#FFFFFF" stroke={LINE} />
          <circle cx="12" cy={row.y + 14} r="5" fill={row.color} />
          <text x="22" y={row.y + 17} fontSize="8.5" fill={INK}>
            {row.text}
          </text>
        </g>
      ))}
      <g stroke="#EEF0F2">
        {[110, 130, 150, 170, 190, 210, 230, 250, 270].map((x) => (
          <line key={x} x1={x} x2={x} y1="0" y2="130" />
        ))}
        {[10, 30, 50, 70, 90, 110].map((y) => (
          <line key={y} x1="92" x2="276" y1={y} y2={y} />
        ))}
      </g>
      <line x1="92" x2="276" y1="70" y2="70" stroke="#7B8794" />
      <line x1="184" x2="184" y1="0" y2="130" stroke="#7B8794" />
      <path d="M140 0 Q 184 180 228 0" fill="none" stroke={RED} strokeWidth="2.5" />
      <path d="M96 92 L276 47" fill="none" stroke={BLUE} strokeWidth="2.5" />
      <circle cx="155.4" cy="84.6" r="3" fill="#FFFFFF" stroke={INK} strokeWidth="1.2" />
      <circle cx="224.5" cy="59.9" r="3" fill="#FFFFFF" stroke={INK} strokeWidth="1.2" />
    </g>
  );
}

function Khan() {
  // A practice question with an answer box and mastery progress.
  const GREEN = "#1FAB54";
  return (
    <g fontFamily={SANS}>
      <rect width="276" height="16" fill="#0B2149" />
      <text x="12" y="11" fontSize="7" fill="#FFFFFF" fontWeight="600">
        Algebra 1 · Solving equations
      </text>
      <text x="14" y="36" fontSize="9" fill={INK} fontWeight="600">
        Solve for x.
      </text>
      <text x="14" y="54" fontSize="12" fill={INK}>
        3x + 5 = 20
      </text>
      <text x="14" y="78" fontSize="9" fill={INK}>
        x =
      </text>
      <rect x="32" y="68" width="44" height="15" rx="3" fill="#FFFFFF" stroke="#2D70B3" strokeWidth="1.3" />
      <text x="50" y="79" fontSize="9" fill={INK}>
        5
      </text>
      <rect x="196" y="86" width="66" height="18" rx="4" fill={GREEN} />
      <text x="216" y="98" fontSize="8" fill="#FFFFFF" fontWeight="700">
        Check
      </text>
      <text x="150" y="36" fontSize="7" fill={SOFT}>
        Skill progress
      </text>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={150 + i * 16} y="42" width="13" height="13" rx="2" fill={i < 5 ? GREEN : "#E3E7EB"} />
      ))}
      <text x="150" y="70" fontSize="7" fill={GREEN} fontWeight="600">
        ✓ 5 of 7 correct
      </text>
    </g>
  );
}

function GeoGebra() {
  // Tool bar, algebra view, and a triangle with draggable points.
  const PURPLE = "#6557D2";
  const pts = { A: [140, 104], B: [250, 104], C: [176, 34] };
  return (
    <g fontFamily={SANS}>
      <rect width="276" height="20" fill="#F7F7F9" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={8 + i * 22} y="3" width="16" height="14" rx="3" fill={i === 1 ? "#E4E0FA" : "#FFFFFF"} stroke={LINE} />
      ))}
      <path d="M33 13 L38 6 L43 13 Z" fill="none" stroke={PURPLE} strokeWidth="1.2" />
      <circle cx="16" cy="10" r="2" fill={PURPLE} />
      <rect y="20" width="96" height="110" fill="#FFFFFF" />
      <line x1="96" x2="96" y1="20" y2="130" stroke={LINE} />
      {["A = (1, 1)", "B = (6, 1)", "C = (2.6, 4.5)", "α = 65.3°"].map((t, i) => (
        <g key={t}>
          <circle cx="12" cy={38 + i * 20} r="3.5" fill={i < 3 ? "#4D4D4D" : PURPLE} />
          <text x="22" y={41 + i * 20} fontSize="8" fill={INK}>
            {t}
          </text>
        </g>
      ))}
      <path
        d={`M${pts.A[0]} ${pts.A[1]} L${pts.B[0]} ${pts.B[1]} L${pts.C[0]} ${pts.C[1]} Z`}
        fill="rgba(101,87,210,0.15)"
        stroke={PURPLE}
        strokeWidth="1.8"
      />
      <path d="M156 104 A16 16 0 0 0 147 90" fill="none" stroke={PURPLE} strokeWidth="1.2" />
      {Object.entries(pts).map(([name, [x, y]]) => (
        <g key={name}>
          <circle cx={x} cy={y} r="4" fill="#4D4D4D" />
          <text x={x + 5} y={y - 6} fontSize="8" fill={INK}>
            {name}
          </text>
        </g>
      ))}
    </g>
  );
}

function Retrieval() {
  // A "brain dump": write down everything you remember, then check.
  return (
    <g fontFamily={SANS}>
      <text x="14" y="20" fontSize="10.5" fontWeight="700" fill={INK}>
        Brain dump
      </text>
      <text x="14" y="33" fontSize="7" fill={SOFT}>
        Write down everything you remember from class.
      </text>
      <rect x="14" y="42" width="160" height="78" rx="4" fill="#FFFBEF" stroke="#EADFC2" />
      {[56, 70, 84, 98, 112].map((y) => (
        <line key={y} x1="22" x2="166" y1={y} y2={y} stroke="#EADFC2" />
      ))}
      <g fontFamily="Spectral, Georgia, serif" fontSize="8.5" fill="#2D3E66">
        <text x="24" y="54">slope = rise / run</text>
        <text x="24" y="68">y = mx + b</text>
        <text x="24" y="82">parallel → same slope</text>
        <text x="24" y="96">b = where it hits the y-axis</text>
      </g>
      <rect x="188" y="42" width="74" height="36" rx="4" fill="#EEF5F5" />
      <text x="196" y="57" fontSize="7" fill="#3E6C70" fontWeight="600">
        Then check
      </text>
      <text x="196" y="69" fontSize="7" fill="#3E6C70">
        your notes ✓
      </text>
    </g>
  );
}
