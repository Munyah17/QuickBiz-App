"use client";

import { useTransition } from "react";
import { Bell, Check } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/cn";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/app/actions/notifications";
import type { NotificationRow } from "@/services/notifications";

const typeTone: Record<NotificationRow["type"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "danger",
};

export function NotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (notifications.length === 0) {
    return (
      <Card>
        <EmptyState icon={Bell} title="No notifications yet" description="You'll see account and billing updates here." />
      </Card>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="flex flex-col gap-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => markAllNotificationsReadAction())}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-workspace disabled:opacity-50"
          >
            <Check className="size-3.5" />
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}
      <Card className="divide-y divide-border-subtle">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={cn("flex items-start justify-between gap-4 p-4", !n.read_at && "bg-primary-50/40")}
        >
          <div className="flex items-start gap-3">
            <Badge tone={typeTone[n.type]} className="mt-0.5 capitalize">
              {n.type}
            </Badge>
            <div>
              <p className="text-sm font-medium text-text-primary">{n.title}</p>
              {n.body && <p className="text-sm text-text-secondary">{n.body}</p>}
              <p className="mt-1 text-xs text-text-tertiary">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          </div>
          {!n.read_at && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => markNotificationReadAction(n.id))}
              title="Mark as read"
              className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-secondary hover:bg-workspace disabled:opacity-50"
            >
              <Check className="size-3.5" />
              Mark read
            </button>
          )}
        </div>
      ))}
      </Card>
    </div>
  );
}
