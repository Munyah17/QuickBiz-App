import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

// No sparkline: the reference design shows a trend line per card, but that
// needs a real time-series snapshot we don't collect yet for these platform
// counters. `delta` is computed from real created_at timestamps (see
// services/dashboard.ts) rather than faking a chart.
export function StatCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: { label: string; direction: "up" | "down" | "flat" };
}) {
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
