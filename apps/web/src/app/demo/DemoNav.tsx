"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ChevronsUpDown, ChevronDown, LogOut, User, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { NAV_STRUCTURE, isNavGroup, prefixNavStructure, type NavLeaf } from "@/config/nav";
import { useDemo } from "@/lib/demo/DemoContext";

const DEMO_NAV = prefixNavStructure(NAV_STRUCTURE, "/demo");

function isLeafActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function LeafLink({ item, active, indent }: { item: NavLeaf; active: boolean; indent?: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        indent && "py-1.5 pl-9 text-[13px]",
        active ? "bg-primary-600 text-white" : "text-sidebar-text hover:bg-sidebar-elevated hover:text-sidebar-text-active"
      )}
    >
      {!indent && <Icon className="size-4 shrink-0" />}
      {item.label}
    </Link>
  );
}

export function DemoSidebar() {
  const { orgName, modules } = useDemo();
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const enabledKeys = new Set(modules.filter((m) => m.enabled).map((m) => m.key));
  const leafVisible = (leaf: NavLeaf) => !leaf.moduleKey || enabledKeys.has(leaf.moduleKey);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col bg-sidebar text-sidebar-text">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary-600">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-sm font-semibold text-sidebar-text-active">QuickBiz ERP</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {DEMO_NAV.map((entry) => {
          if (!isNavGroup(entry)) {
            if (!leafVisible(entry)) return null;
            return <LeafLink key={entry.key} item={entry} active={isLeafActive(pathname, entry.href)} />;
          }

          const visibleChildren = entry.children.filter(leafVisible);
          if (visibleChildren.length === 0) return null;

          const groupActive = visibleChildren.some((c) => isLeafActive(pathname, c.href));
          const open = openGroups.has(entry.key) || groupActive;
          const Icon = entry.icon;

          return (
            <div key={entry.key}>
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((prev) => {
                    const next = new Set(prev);
                    if (next.has(entry.key)) next.delete(entry.key);
                    else next.add(entry.key);
                    return next;
                  })
                }
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  groupActive ? "text-sidebar-text-active" : "text-sidebar-text hover:bg-sidebar-elevated hover:text-sidebar-text-active"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{entry.label}</span>
                <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <div className="mt-0.5 space-y-0.5">
                  {visibleChildren.map((child) => (
                    <LeafLink key={child.key} item={child} active={isLeafActive(pathname, child.href)} indent />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="mx-2 mb-3 flex items-center gap-2 rounded-md bg-sidebar-elevated px-3 py-2.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
          {orgName.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-sidebar-text-active">{orgName}</p>
          <p className="truncate text-xs text-sidebar-heading">Demo workspace</p>
        </div>
        <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-heading" />
      </div>
    </aside>
  );
}

function DemoUserMenu() {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const { orgName, updateOrgName } = useDemo();
  const [nameDraft, setNameDraft] = useState(orgName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setEditingName(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-workspace">
        <div className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">D</div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium leading-tight text-text-primary">Demo Owner</p>
          <p className="text-xs leading-tight text-text-tertiary">Owner</p>
        </div>
        <ChevronDown className="size-4 text-text-tertiary" />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-border bg-surface py-1 shadow-popover">
          {editingName ? (
            <form
              className="flex items-center gap-2 px-3 py-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (nameDraft.trim()) updateOrgName(nameDraft.trim());
                setEditingName(false);
              }}
            >
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="h-8 w-full rounded-md border border-border px-2 text-sm focus:outline-none"
              />
              <button type="submit" className="text-xs font-medium text-primary-600">
                Save
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-workspace"
            >
              <User className="size-4" />
              My Profile
            </button>
          )}
          <Link href="/demo/company" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-workspace">
            <Settings className="size-4" />
            Settings
          </Link>
          <div className="my-1 border-t border-border-subtle" />
          <Link href="/login" className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-workspace">
            <LogOut className="size-4" />
            Exit Demo
          </Link>
        </div>
      )}
    </div>
  );
}

export function DemoTopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
      <div className="flex items-center gap-2 rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-600">
        Demo Mode - nothing here is saved
      </div>
      <div className="ml-auto flex items-center gap-1">
        <DemoUserMenu />
      </div>
    </header>
  );
}
