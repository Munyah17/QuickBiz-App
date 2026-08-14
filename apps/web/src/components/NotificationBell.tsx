"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { markNotificationReadAction } from "@/app/actions/notifications";
import type { NotificationRow } from "@/services/notifications";
import { cn } from "@/lib/cn";

export function NotificationBell({ notifications }: { notifications: NotificationRow[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-workspace"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-80 rounded-md border border-border bg-surface shadow-popover">
          <div className="border-b border-border-subtle px-3 py-2 text-sm font-semibold text-text-primary">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-text-tertiary">You&apos;re all caught up</p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markNotificationReadAction(n.id)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-border-subtle px-3 py-2.5 text-left last:border-b-0 hover:bg-workspace",
                  !n.read_at && "bg-primary-50/40"
                )}
              >
                <span className="text-sm font-medium text-text-primary">{n.title}</span>
                {n.body && <span className="text-xs text-text-secondary">{n.body}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
