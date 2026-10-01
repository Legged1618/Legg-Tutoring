/**
 * Stand-in portrait until Ed's photo is uploaded: a soft default profile
 * graphic. Swap for an <Image> once the real photo is in /public.
 */
export default function ProfileAvatar({ size = 220, label = "Photo coming soon" }: { size?: number; label?: string }) {
  return (
    <svg
      className="profile-avatar"
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={label}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="avatar-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B7CBCC" />
          <stop offset="1" stopColor="#DACBAD" />
        </linearGradient>
        <clipPath id="avatar-clip">
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-clip)">
        <rect width="200" height="200" fill="url(#avatar-bg)" />
        <circle cx="100" cy="82" r="38" fill="#F7F3EA" opacity="0.92" />
        <path d="M30 200c4-44 34-70 70-70s66 26 70 70z" fill="#F7F3EA" opacity="0.92" />
      </g>
    </svg>
  );
}
