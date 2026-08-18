import { CATEGORY_COLORS } from "./CategoryDonutChart";

export interface BreakdownSegment {
  label: string;
  value: number;
}

// Horizontal bar list for categorical count/magnitude breakdowns (ticket
// status, vehicle status, headcount by department) — the donut chart is
// reserved for currency part-to-whole; this is the non-currency counterpart,
// same fixed categorical color order so the two read as one system.
export function BreakdownBarChart({
  segments,
  formatValue = (v) => v.toLocaleString(),
}: {
  segments: BreakdownSegment[];
  formatValue?: (value: number) => string;
}) {
  const sorted = [...segments].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((s) => s.value), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {sorted.map((s, i) => (
        <li key={s.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm capitalize text-text-secondary">{s.label}</span>
          <div className="h-2 flex-1 rounded-full bg-workspace">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max((s.value / max) * 100, s.value > 0 ? 3 : 0)}%`,
                backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
              }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-sm font-medium text-text-primary">{formatValue(s.value)}</span>
        </li>
      ))}
    </ul>
  );
}
