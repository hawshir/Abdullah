import { useId, useMemo } from "react";
import type { Ref } from "react";

function bumpyPath(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  const n = 90;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r + Math.sin(a * 7 + 0.6) * 1.6 + Math.sin(a * 13) * 1.1 + Math.sin(a * 3) * 1.2;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

type Props = {
  size?: number;
  label?: string;
  className?: string;
  crackRef?: Ref<SVGPathElement>;
};

export default function WaxSeal({ size = 120, label = "A", className, crackRef }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const edge = useMemo(() => bumpyPath(60, 60, 51), []);
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}g`} cx="0.35" cy="0.28" r="0.95">
          <stop offset="0" stopColor="#fff3b8" />
          <stop offset="0.35" stopColor="#f5d76e" />
          <stop offset="0.75" stopColor="#d4af37" />
          <stop offset="1" stopColor="#8a6416" />
        </radialGradient>
      </defs>
      <path d={edge} fill={`url(#${id}g)`} stroke="#8a6416" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(90,60,5,.45)" strokeWidth="1.6" />
      <circle cx="60" cy="60" r="37.5" fill="none" stroke="rgba(255,248,200,.65)" strokeWidth="0.8" />
      <text
        x="60"
        y="77"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight={900}
        fontSize="46"
        fill="#6b4c0c"
        stroke="rgba(255,240,170,.55)"
        strokeWidth="0.6"
      >
        {label}
      </text>
      <path
        ref={crackRef}
        d="M62 6 L53 28 L67 44 L51 62 L66 80 L55 114"
        fill="none"
        stroke="#2b1c00"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={160}
        strokeDasharray={160}
        strokeDashoffset={160}
        opacity={0}
      />
    </svg>
  );
}
