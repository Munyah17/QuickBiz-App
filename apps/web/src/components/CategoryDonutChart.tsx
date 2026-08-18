import type { DonutChart } from "@/services/dashboard";

// Fixed categorical order (never cycled/generated) — validated for CVD
// separation and lightness band via the dataviz skill's validator script
// against this app's own brand tokens (blue/green/purple/amber/red).
export const CATEGORY_COLORS = [
  "var(--color-primary-600)",
  "var(--color-success-500)",
  "var(--color-accent-purple-500)",
  "var(--color-warning-500)",
  "var(--color-danger-500)",
];
const OTHER_COLOR = "var(--color-text-tertiary)";
const MAX_SEGMENTS = 5;

const SIZE = 160;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_PX = 2;

interface Arc {
  label: string;
  value: number;
  color: string;
  pct: number;
  dashArray: string;
  dashOffset: number;
}

function buildArcs(segments: Array<{ label: string; value: number }>, total: number): Arc[] {
  let cumulativeValue = 0;
  return segments.map((seg, i) => {
    const isOther = seg.label === "Other";
    const fraction = total === 0 ? 0 : seg.value / total;
    const length = Math.max(fraction * CIRCUMFERENCE - GAP_PX, 0);
    const dashOffset = total === 0 ? 0 : -(cumulativeValue / total) * CIRCUMFERENCE;
    cumulativeValue += seg.value;
    return {
      label: seg.label,
      value: seg.value,
      color: isOther ? OTHER_COLOR : CATEGORY_COLORS[i % CATEGORY_COLORS.length]!,
      pct: Math.round(fraction * 100),
      dashArray: `${length} ${CIRCUMFERENCE - length}`,
      dashOffset,
    };
  });
}

export function CategoryDonutChart({ chart }: { chart: DonutChart }) {
  const sorted = [...chart.segments].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, MAX_SEGMENTS);
  const rest = sorted.slice(MAX_SEGMENTS);
  const otherTotal = rest.reduce((sum, s) => sum + s.value, 0);
  const segments = otherTotal > 0 ? [...top, { label: "Other", value: otherTotal }] : top;

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  // Pure precompute (module-level function, no closure mutation inside JSX).
  const arcs = buildArcs(segments, total);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={chart.title}>
        <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-border-subtle)" strokeWidth={STROKE} />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
            >
              <title>
                {arc.label}: ${arc.value.toLocaleString()} ({arc.pct}%)
              </title>
            </circle>
          ))}
        </g>
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" className="fill-text-primary text-base font-semibold">
          ${total.toLocaleString()}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 14} textAnchor="middle" className="fill-text-tertiary text-[10px]">
          Total
        </text>
      </svg>

      <ul className="flex flex-1 flex-col gap-1.5">
        {arcs.map((arc) => (
          <li key={arc.label} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: arc.color }} />
            <span className="flex-1 truncate capitalize text-text-secondary">{arc.label}</span>
            <span className="font-medium text-text-primary">${arc.value.toLocaleString()}</span>
            <span className="w-9 text-right text-xs text-text-tertiary">{arc.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
