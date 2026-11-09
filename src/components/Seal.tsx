import { useMemo, type ReactNode, type CSSProperties } from "react";

function waxBlob(r: number, n = 64) {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + 1.9 * Math.sin(a * 5 + 0.8) + 1.2 * Math.cos(a * 9 + 2) + 0.7 * Math.sin(a * 13);
    pts.push(`${(50 + Math.cos(a) * rr).toFixed(2)},${(50 + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
}

interface SealProps {
  size?: number | string;
  id: string;
  letter?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Gold wax seal with monogram. `children` render on top (e.g. a crack). */
export function Seal({ size = 120, id, letter = "A", className, style, children }: SealProps) {
  const d = useMemo(() => waxBlob(44), []);
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-g`} cx="35%" cy="28%" r="85%">
          <stop offset="0" stopColor="#fff1b0" />
          <stop offset="0.32" stopColor="#f5d76e" />
          <stop offset="0.72" stopColor="#d4af37" />
          <stop offset="1" stopColor="#8f6b12" />
        </radialGradient>
        <linearGradient id={`${id}-l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="1" stopColor="#c39a26" />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id}-g)`} />
      <path d={d} fill="none" stroke="rgba(255,246,200,.45)" strokeWidth="0.8" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="rgba(90,60,5,.5)" strokeWidth="1.4" />
      <circle cx="50" cy="50" r="30.5" fill="none" stroke="rgba(255,240,170,.55)" strokeWidth="0.7" />
      <text
        x="50"
        y="51.2"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize="36"
        fill="rgba(90,60,5,.65)"
      >
        {letter}
      </text>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize="36"
        fill={`url(#${id}-l)`}
        opacity="0.55"
      >
        {letter}
      </text>
      {children}
    </svg>
  );
}
