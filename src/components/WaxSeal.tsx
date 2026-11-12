import { useId, useMemo } from "react";

/** Gold wax seal with "A" monogram. Pure SVG. */
export default function WaxSeal({
  size = 96,
  letter = "A",
  crack = false,
}: {
  size?: number;
  letter?: string;
  crack?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const edge = useMemo(() => {
    const pts: string[] = [];
    const n = 96;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 43 + 2.4 * Math.sin(a * 13) + 1.1 * Math.sin(a * 5 + 1.3);
      pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
    }
    return `M${pts.join("L")}Z`;
  }, []);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id={`g${uid}`} cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#fff1bf" />
          <stop offset="35%" stopColor="#f5d76e" />
          <stop offset="75%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#8a6a16" />
        </radialGradient>
        <radialGradient id={`i${uid}`} cx="60%" cy="68%" r="80%">
          <stop offset="0%" stopColor="#f5d76e" />
          <stop offset="100%" stopColor="#b8902a" />
        </radialGradient>
      </defs>
      <path d={edge} fill={`url(#g${uid})`} />
      <circle cx="50" cy="50" r="31" fill={`url(#i${uid})`} stroke="rgba(110,80,10,.55)" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="rgba(255,246,207,.55)" strokeWidth=".7" strokeDasharray="1.6 2.2" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Playfair Display', serif"
        fontWeight="900"
        fontSize="36"
        fill="rgba(255,246,207,.7)"
        transform="translate(-.8 -.8)"
      >
        {letter}
      </text>
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Playfair Display', serif"
        fontWeight="900"
        fontSize="36"
        fill="#7a5a10"
      >
        {letter}
      </text>
      {crack && (
        <path
          className="seal-crack"
          d="M54 4 L47 22 L57 33 L44 48 L55 60 L45 74 L52 96"
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
          style={{ filter: "drop-shadow(0 0 4px #fff6cf)" }}
        />
      )}
    </svg>
  );
}
