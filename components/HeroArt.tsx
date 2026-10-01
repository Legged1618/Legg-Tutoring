/**
 * Placeholder hero illustration: a stylized session whiteboard with a
 * graph and some worked algebra. Replace with a real screenshot or photo
 * whenever one is ready.
 */
export default function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      <span className="hero-blob hero-blob-teal" />
      <span className="hero-blob hero-blob-brass" />
      <div className="hero-board">
        <div className="hero-board-bar">
          <span />
          <span />
          <span />
          <em>Session room</em>
        </div>
        <svg viewBox="0 0 360 230" xmlns="http://www.w3.org/2000/svg">
          <g stroke="#DCD5C4" strokeWidth="1">
            {[40, 80, 120, 160, 200].map((y) => (
              <line key={`h${y}`} x1="20" x2="200" y1={y} y2={y} />
            ))}
            {[40, 80, 120, 160].map((x) => (
              <line key={`v${x}`} y1="20" y2="210" x1={x} x2={x} />
            ))}
          </g>
          <line x1="20" x2="200" y1="160" y2="160" stroke="#52616F" strokeWidth="1.5" />
          <line x1="80" x2="80" y1="20" y2="210" stroke="#52616F" strokeWidth="1.5" />
          <path
            d="M30 40 Q 110 290 190 40"
            fill="none"
            stroke="#3E6C70"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="hero-curve"
          />
          <circle cx="110" cy="165" r="5" fill="#A9762E" />
          <g fontFamily="Spectral, serif" fill="#1D2733">
            <text x="222" y="62" fontSize="19">x² − 4x + 3 = 0</text>
            <text x="222" y="102" fontSize="19">(x − 1)(x − 3) = 0</text>
            <text x="222" y="142" fontSize="19" fill="#3E6C70">x = 1 or x = 3</text>
          </g>
          <path d="M222 156 q 40 10 92 0" stroke="#A9762E" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <g fontFamily="IBM Plex Sans, sans-serif" fontSize="12" fill="#52616F">
            <text x="222" y="196">Let&apos;s check: 1 − 4 + 3 = 0 ✓</text>
          </g>
        </svg>
      </div>
      <div className="hero-chip hero-chip-top">
        <strong>Free</strong> 15-minute call
      </div>
      <div className="hero-chip hero-chip-bottom">
        <span className="hero-chip-dot" /> Live video + shared whiteboard
      </div>
    </div>
  );
}
