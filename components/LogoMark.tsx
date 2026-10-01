/**
 * The Legg Tutoring monogram: an L with a brass dot on a rounded badge.
 * Same design as the favicon (app/icon.svg). Use tone="dark" on navy
 * backgrounds such as the footer.
 */
export default function LogoMark({ size = 32, tone = "light" }: { size?: number; tone?: "light" | "dark" }) {
  const badge = tone === "dark" ? "#F7F3EA" : "#1D2733";
  const letter = tone === "dark" ? "#1D2733" : "#DACBAD";
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill={badge} />
      <path
        d="M22 16v28h20"
        fill="none"
        stroke={letter}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="44" cy="20" r="4.5" fill="#A9762E" />
    </svg>
  );
}
