"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User, Bell, Settings } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export function UserMenu({ name, roleName }: { name: string; roleName: string }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-workspace"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-text-primary">{name}</p>
          <p className="text-xs leading-tight text-text-tertiary">{roleName}</p>
        </div>
        <ChevronDown className="size-4 text-text-tertiary" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 rounded-md border border-border bg-surface py-1 shadow-popover">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-workspace"
          >
            <User className="size-4" />
            My Profile
          </Link>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-workspace"
          >
            <Bell className="size-4" />
            Notifications
          </Link>
          <Link
            href="/company"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-workspace"
          >
            <Settings className="size-4" />
            Settings
          </Link>
          <div className="my-1 border-t border-border-subtle" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-workspace"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
