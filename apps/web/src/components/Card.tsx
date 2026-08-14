import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-md border border-border bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {action}
    </div>
  );
}
