/**
 * The Legg Tutoring mark: a right triangle whose two legs form an L.
 * `tone="dark"` is for dark backgrounds (footer).
 */
export default function LogoMark({ size = 32, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  const leg = tone === "dark" ? "#F7F3EA" : "#1D2733";
  const hyp = tone === "dark" ? "#D4A45E" : "#A9762E";
  const fill = tone === "dark" ? "rgba(183,203,204,0.18)" : "rgba(62,108,112,0.16)";
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M16 48 L50 48 L16 12 Z" fill={fill} />
      <path d="M16 12 V48 H50" fill="none" stroke={leg} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 12 L50 48" stroke={hyp} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 40 H24 V48" fill="none" stroke={hyp} strokeWidth="2" />
    </svg>
  );
}
