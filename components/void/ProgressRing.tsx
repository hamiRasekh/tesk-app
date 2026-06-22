type Props = {
  percent: number;
  color?: string;
  size?: number;
  complete?: boolean;
};

export function ProgressRing({ percent, color = "#8b5cf6", size = 44, complete }: Props) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <svg width={size} height={size} className="void-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={complete ? "#2dd4bf" : color}
        strokeWidth="3"
        strokeDasharray={c}
        strokeDashoffset={complete ? 0 : offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: complete ? "drop-shadow(0 0 6px #2dd4bf)" : `drop-shadow(0 0 6px ${color})` }}
      />
      {complete && (
        <text x="50%" y="54%" textAnchor="middle" fill="#2dd4bf" fontSize="14" fontWeight="700">
          ✓
        </text>
      )}
    </svg>
  );
}
