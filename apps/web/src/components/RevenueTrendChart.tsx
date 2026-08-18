import type { RevenuePoint } from "@/services/dashboard";

const WIDTH = 640;
const HEIGHT = 200;
const PAD_LEFT = 44;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function niceMax(max: number): number {
  if (max <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

// Single-series line chart (spec: "trend over time -> line") — no legend
// needed for one series per the mark spec, so the card title carries what's
// plotted. Native <title> tooltips are a deliberate simplification of the
// full hover/crosshair spec given this build's time budget.
export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const chartWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const chartHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const maxValue = niceMax(Math.max(...data.map((d) => d.revenue), 0));
  const xStep = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PAD_LEFT + i * xStep,
    y: PAD_TOP + chartHeight - (maxValue === 0 ? 0 : (d.revenue / maxValue) * chartHeight),
    ...d,
  }));

  const first = points[0];
  const last = points[points.length - 1];

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const baseline = (PAD_TOP + chartHeight).toFixed(1);
  const areaPath =
    first && last ? `${linePath} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z` : "";

  const gridLines = [0, 0.5, 1].map((t) => ({ t, y: PAD_TOP + chartHeight * (1 - t) }));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Revenue trend, last 14 days">
      {gridLines.map(({ y }) => (
        <line key={y} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} stroke="var(--color-border)" strokeWidth={1} />
      ))}
      {gridLines.map(({ t, y }) => (
        <text key={y} x={PAD_LEFT - 8} y={y + 3} textAnchor="end" className="fill-text-tertiary text-[9px]">
          ${Math.round(maxValue * t).toLocaleString()}
        </text>
      ))}

      {points
        .filter((_, i) => i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1)
        .map((p, i) => (
          <text key={i} x={p.x} y={HEIGHT - 8} textAnchor="middle" className="fill-text-tertiary text-[9px]">
            {new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </text>
        ))}

      <path d={areaPath} fill="var(--color-primary-600)" opacity={0.1} />
      <path d={linePath} fill="none" stroke="var(--color-primary-600)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.revenue > 0 ? 3 : 0} fill="var(--color-primary-600)" stroke="var(--color-surface)" strokeWidth={2}>
          <title>
            {new Date(p.date).toLocaleDateString()}: ${p.revenue.toLocaleString()}
          </title>
        </circle>
      ))}

      {last && (
        <text x={last.x} y={last.y - 10} textAnchor="end" className="fill-text-primary text-[10px] font-semibold">
          ${last.revenue.toLocaleString()}
        </text>
      )}
    </svg>
  );
}
