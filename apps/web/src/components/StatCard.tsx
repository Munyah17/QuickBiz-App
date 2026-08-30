import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

// Fixed, non-cycled tone order (dataviz skill: color assigned by fixed
// sequence, never re-picked per data) — used positionally for the
// headline stat cards, not to encode any data dimension.
const TONE_CLASSES = {
  primary: "bg-primary-600 text-white",
  success: "bg-success-500 text-white",
  info: "bg-accent-purple-500 text-white",
  warning: "bg-warning-500 text-white",
} as const;

export type StatCardTone = keyof typeof TONE_CLASSES;

// No sparkline: the reference design shows a trend line per card, but that
// needs a real time-series snapshot we don't collect yet for these platform
// counters. `delta` is computed from real created_at timestamps (see
// services/dashboard.ts) rather than faking a chart.
export function StatCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string;
  value: string;
  delta?: { label: string; direction: "up" | "down" | "flat" };
  tone?: StatCardTone;
}) {
  if (tone) {
    return (
      <div className={cn("flex flex-col gap-2 rounded-md p-4 shadow-card", TONE_CLASSES[tone])}>
        <span className="text-sm text-white/80">{label}</span>
        <span className="text-2xl font-semibold text-white">{value}</span>
        {delta && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-white/80">
            {delta.direction === "up" && <ArrowUpRight className="size-3.5" />}
            {delta.direction === "down" && <ArrowDownRight className="size-3.5" />}
            {delta.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 shadow-card">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-2xl font-semibold text-text-primary">{value}</span>
      {delta && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            delta.direction === "up" && "text-success-600",
            delta.direction === "down" && "text-danger-600",
            delta.direction === "flat" && "text-text-tertiary"
          )}
        >
          {delta.direction === "up" && <ArrowUpRight className="size-3.5" />}
          {delta.direction === "down" && <ArrowDownRight className="size-3.5" />}
          {delta.label}
        </span>
      )}
    </div>
  );
}
