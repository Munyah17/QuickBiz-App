"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CoolNavItem } from "./nav-model";

function isLeafActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

interface TooltipState {
  label: string;
  top: number;
  left: number;
}

/**
 * CoolAdmin `aside.menu-sidebar` — same markup/classes as the template, with
 * the QuickBiz nav structure injected and interactions (accordion groups,
 * collapsed-rail tooltips) driven by React state instead of main-vanilla.js.
 */
export function CoolAdminSidebar({
  model,
  collapsed,
  onNavigate,
  onClose,
  homeHref = "/dashboard",
}: {
  model: CoolNavItem[];
  collapsed: boolean;
  /** Fired when a real nav link is followed — closes the mobile drawer. */
  onNavigate: () => void;
  /** The `.sidebar-close` button inside the logo row (mobile drawer). */
  onClose: () => void;
  /** Logo link target ("/demo/dashboard" in the demo shell). */
  homeHref?: string;
}) {
  const pathname = usePathname();
  // Groups stay collapsed until the user clicks one. Explicit toggles are the
  // only thing that opens a section — nothing auto-expands on navigation.
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = (e: React.SyntheticEvent<HTMLElement>, label: string) => {
    if (!collapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 10 });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <aside className="menu-sidebar" id="main-sidebar">
      <div className="logo">
        <Link className="logo-link" href="/dashboard" aria-label="QuickBiz ERP home">
          <span className="logo-mark" aria-hidden="true">
            Q
          </span>
          <span className="logo-text">QuickBiz ERP</span>
        </Link>
        <button
          className="sidebar-close js-sidebar-toggle"
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="menu-sidebar__content js-scrollbar1">
        <nav className="navbar-sidebar">
          <ul className="list-unstyled navbar__list">
            {model.map((item) => {
              if (!item.children) {
                const active = item.href ? isLeafActive(pathname, item.href) : false;
                const LeafIcon = item.icon;
                return (
                  <li key={item.key} className={cn(active && "active")}>
                    <Link
                      href={item.href ?? "#"}
                      onClick={onNavigate}
                      onMouseEnter={(e) => showTooltip(e, item.label)}
                      onMouseLeave={hideTooltip}
                      onFocus={(e) => showTooltip(e, item.label)}
                      onBlur={hideTooltip}
                    >
                      <LeafIcon size={16} strokeWidth={1.9} aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              }

              const groupActive = item.children.some(
                (c) => c.href && isLeafActive(pathname, c.href),
              );
              // Retracted by default — only an explicit click opens a group,
              // even when it contains the active route.
              const open = groupOverrides[item.key] ?? false;

              const GroupIcon = item.icon;
              return (
                <li key={item.key} className={cn("has-sub", groupActive && "active")}>
                  <a
                    className={cn("js-arrow", open && "open")}
                    href="#"
                    aria-expanded={open}
                    onClick={(e) => {
                      e.preventDefault();
                      setGroupOverrides((prev) => ({ ...prev, [item.key]: !open }));
                    }}
                    onMouseEnter={(e) => showTooltip(e, item.label)}
                    onMouseLeave={hideTooltip}
                    onFocus={(e) => showTooltip(e, item.label)}
                    onBlur={hideTooltip}
                  >
                    <GroupIcon size={16} strokeWidth={1.9} aria-hidden="true" />
                    {item.label}
                  </a>
                  <ul
                    className={cn(
                      "list-unstyled navbar__sub-list js-sub-list",
                      open && "is-open",
                    )}
                  >
                    {item.children.map((child) => {
                      const active = child.href
                        ? isLeafActive(pathname, child.href)
                        : false;
                      return (
                        <li key={child.key} className={cn(active && "active")}>
                          <Link href={child.href ?? "#"} onClick={onNavigate}>
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      {tooltip && (
        <div
          className="sidebar-tooltip is-visible"
          role="tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          {tooltip.label}
        </div>
      )}
    </aside>
  );
}
