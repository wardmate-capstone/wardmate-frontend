interface NationalEmblemProps {
  className?: string;
  size?: number;
  title?: string;
}

export function NationalEmblem({ className, size = 64, title = 'Quốc huy Việt Nam' }: NationalEmblemProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="emblemRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D82A20" />
          <stop offset="50%" stopColor="#B91C1C" />
          <stop offset="100%" stopColor="#8F1515" />
        </linearGradient>
        <linearGradient id="emblemGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF199" />
          <stop offset="40%" stopColor="#F5D76E" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
        <filter id="emblemShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#8F1515" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer Golden Border & Red Circular Disc */}
      <circle cx="50" cy="50" r="47" fill="url(#emblemRedGrad)" stroke="url(#emblemGoldGrad)" strokeWidth="3" filter="url(#emblemShadow)" />
      <circle cx="50" cy="50" r="44.5" stroke="#F5D76E" strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.6" />

      {/* Symmetrical Rice Stalks (Left and Right) */}
      <g fill="url(#emblemGoldGrad)" stroke="#B91C1C" strokeWidth="0.3">
        {/* Left rice ear stalk */}
        <path d="M22 68 C 15 54, 18 36, 30 25 C 27 29, 23 45, 29 65 Z" />
        <ellipse cx="19" cy="55" rx="3.5" ry="1.8" transform="rotate(-35 19 55)" />
        <ellipse cx="20" cy="46" rx="3.8" ry="1.8" transform="rotate(-25 20 46)" />
        <ellipse cx="23" cy="38" rx="3.8" ry="1.8" transform="rotate(-15 23 38)" />
        <ellipse cx="28" cy="31" rx="3.5" ry="1.8" transform="rotate(-5 28 31)" />
        <ellipse cx="35" cy="26" rx="3.2" ry="1.8" transform="rotate(10 35 26)" />

        {/* Right rice ear stalk */}
        <path d="M78 68 C 85 54, 82 36, 70 25 C 73 29, 77 45, 71 65 Z" />
        <ellipse cx="81" cy="55" rx="3.5" ry="1.8" transform="rotate(35 81 55)" />
        <ellipse cx="80" cy="46" rx="3.8" ry="1.8" transform="rotate(25 80 46)" />
        <ellipse cx="77" cy="38" rx="3.8" ry="1.8" transform="rotate(15 77 38)" />
        <ellipse cx="72" cy="31" rx="3.5" ry="1.8" transform="rotate(5 72 31)" />
        <ellipse cx="65" cy="26" rx="3.2" ry="1.8" transform="rotate(-10 65 26)" />
      </g>

      {/* Industrial Cogwheel at bottom */}
      <g fill="url(#emblemGoldGrad)">
        <circle cx="50" cy="74" r="10" />
        {/* Cog teeth */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <rect
            key={deg}
            x="48.5"
            y="61"
            width="3"
            height="4"
            rx="0.5"
            transform={`rotate(${deg} 50 74)`}
          />
        ))}
        <circle cx="50" cy="74" r="4.5" fill="#B91C1C" />
      </g>

      {/* Central Golden Five-Pointed Star */}
      <polygon
        points="50,22 54.5,35.5 69,35.5 57,44.5 61.5,58 50,49.5 38.5,58 43,44.5 31,35.5 45.5,35.5"
        fill="url(#emblemGoldGrad)"
        stroke="#F5D76E"
        strokeWidth="0.5"
        filter="url(#emblemShadow)"
      />

      {/* Bottom Red Ribbon with Gold Rim */}
      <path
        d="M24 77 C 32 82, 68 82, 76 77 L 77 84 C 68 88, 32 88, 23 84 Z"
        fill="#8F1515"
        stroke="url(#emblemGoldGrad)"
        strokeWidth="1.2"
      />
      <circle cx="27" cy="81" r="1.5" fill="#F5D76E" />
      <circle cx="73" cy="81" r="1.5" fill="#F5D76E" />
    </svg>
  );
}
