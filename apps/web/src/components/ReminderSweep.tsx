"use client";

import { useEffect } from "react";
import { runReminderSweepAction } from "@/app/actions/reminders";

const STORAGE_KEY = "qb-reminder-sweep-at";
// The sweep is cheap (a handful of count queries) but there's no value in
// running it on every refresh — once an hour per browser session is plenty,
// and DB dedupe keys make any extra runs no-ops anyway.
const MIN_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Invisible component mounted in the dashboard layout. Fires the reminder
 * sweep once per hour so time-based notifications (subscription renewals,
 * overdue invoices, pending approvals, late shipments, low stock) get
 * created without needing a cron worker.
 */
export function ReminderSweep() {
  useEffect(() => {
    const last = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return;
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    // Fire-and-forget: a failed sweep must never break the shell.
    runReminderSweepAction().catch(() => {});
  }, []);

  return null;
}
