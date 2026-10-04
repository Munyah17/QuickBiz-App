"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  Contact,
  CircleUserRound,
  FileText,
  GitBranch,
  Menu,
  Package,
  Power,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { searchWorkspaceAction } from "@/app/actions/search";
import { markNotificationReadAction } from "@/app/actions/notifications";
import { signOutAction } from "@/app/actions/auth";
import type { SearchResult } from "@/services/search";
import type { NotificationRow } from "@/services/notifications";

const RESULT_ICON: Record<SearchResult["type"], LucideIcon> = {
  branch: GitBranch,
  user: CircleUserRound,
  customer: Contact,
  product: Package,
  invoice: FileText,
};

type OpenMenu = "notifications" | "account" | null;

/**
 * CoolAdmin `header.header-desktop` — sidebar toggle, global search, the
 * notification dropdown and the account dropdown. Same markup/classes as the
 * template; dropdown open state is React-driven (`.show-dropdown` on
 * `.js-item-menu`, exactly what main-vanilla.js toggles).
 */
export function CoolAdminHeader({
  userName,
  roleName,
  email,
  orgName,
  branchName,
  notifications,
  onToggleSidebar,
  sidebarExpanded,
  demo = false,
}: {
  userName: string;
  roleName: string;
  email: string;
  orgName: string;
  branchName: string;
  notifications: NotificationRow[];
  onToggleSidebar: () => void;
  /** Drawer open on mobile / full sidebar on desktop — feeds aria-expanded. */
  sidebarExpanded: boolean;
  /** Demo shell: no auth/session, so server actions are skipped. */
  demo?: boolean;
}) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const searchRef = useRef<HTMLFormElement>(null);

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const queryLongEnough = query.trim().length >= 2;

  // Click-outside closes the topbar dropdowns (mirrors the template's
  // document-body click handler for `.js-item-menu`).
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (wrapRef.current && !wrapRef.current.contains(target)) setOpenMenu(null);
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!queryLongEnough) return;
    const timeout = setTimeout(() => {
      if (demo) {
        // No server action in the demo shell — just show the empty state.
        setResults([]);
        setSearchOpen(true);
        return;
      }
      startTransition(async () => {
        const data = await searchWorkspaceAction(query);
        setResults(data);
        setSearchOpen(true);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, queryLongEnough, demo]);

  const toggleMenu = (menu: Exclude<OpenMenu, null>) =>
    setOpenMenu((current) => (current === menu ? null : menu));

  return (
    <header className="header-desktop">
      <div className="section__content section__content--p30">
        <div className="container-fluid">
          <div className="header-wrap">
            <button
              className="sidebar-toggle js-sidebar-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={sidebarExpanded}
              aria-controls="main-sidebar"
              onClick={onToggleSidebar}
            >
              <Menu size={20} strokeWidth={2} aria-hidden="true" />
            </button>

            <form
              className="form-header"
              role="search"
              ref={searchRef}
              onSubmit={(e) => e.preventDefault()}
            >
              <Search className="form-header__icon" size={16} aria-hidden="true" />
              <input
                className="au-input au-input--xl"
                type="search"
                name="search"
                placeholder="Search customers, products, invoices…"
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => queryLongEnough && results.length > 0 && setSearchOpen(true)}
              />
              <kbd className="form-header__hint" aria-hidden="true">
                ⌘K
              </kbd>
              {searchOpen && queryLongEnough && (results.length > 0 || isPending) && (
                <div className="search-dropdown">
                  {isPending && <p className="search-dropdown__empty">Searching…</p>}
                  {!isPending &&
                    results.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        className="search-dropdown__item"
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          router.push(result.href);
                        }}
                      >
                        {(() => {
                          const ResultIcon = RESULT_ICON[result.type];
                          return <ResultIcon size={14} aria-hidden="true" />;
                        })()}
                        <span className="search-dropdown__label">{result.label}</span>
                        <span className="search-dropdown__sublabel">{result.sublabel}</span>
                      </button>
                    ))}
                  {!isPending && results.length === 0 && (
                    <p className="search-dropdown__empty">No matches</p>
                  )}
                </div>
              )}
            </form>

            <div className="header-button" ref={wrapRef}>
              <div className="noti-wrap">
                <div
                  className={cn("noti__item js-item-menu", openMenu === "notifications" && "show-dropdown")}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="true"
                  aria-label="Notifications"
                  onClick={() => toggleMenu("notifications")}
                  onKeyDown={(e) => e.key === "Enter" && toggleMenu("notifications")}
                >
                  <Bell size={18} aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="quantity">{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                  <div
                    className="notifi-dropdown js-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="notifi__title">
                      <p>
                        {unreadCount > 0
                          ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                          : "You're all caught up"}
                      </p>
                    </div>
                    {notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        className={cn("notifi__item", !n.read_at && "notifi__item--unread")}
                        onClick={() => { if (!demo) void markNotificationReadAction(n.id); }}
                      >
                        <div className="bg-c1 img-cir img-40">
                          <Bell size={15} aria-hidden="true" />
                        </div>
                        <div className="content">
                          <p>{n.title}</p>
                          {n.body && <span className="date">{n.body}</span>}
                        </div>
                      </div>
                    ))}
                    <div className="notifi__footer">
                      <Link href={demo ? "/demo/dashboard" : "/notifications"}>
                        {demo ? "Demo — nothing is saved" : "All notifications"}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="account-wrap">
                <div
                  className={cn("account-item clearfix js-item-menu", openMenu === "account" && "show-dropdown")}
                  role="button"
                  tabIndex={0}
                  aria-haspopup="true"
                  aria-label="Account menu"
                  onClick={() => toggleMenu("account")}
                  onKeyDown={(e) => e.key === "Enter" && toggleMenu("account")}
                >
                  <div className="image">
                    <span className="avatar-initials" aria-hidden="true">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="content">
                    <a className="js-acc-btn" href="#" onClick={(e) => e.preventDefault()}>
                      {userName}
                    </a>
                  </div>
                  <div
                    className="account-dropdown js-dropdown"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="info clearfix">
                      <div className="image">
                        <span className="avatar-initials" aria-hidden="true">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="content">
                        <h5 className="name">
                          <Link href="/profile">{userName}</Link>
                        </h5>
                        <span className="email">{email}</span>
                        <span className="email">
                          {orgName}
                          {branchName ? ` · ${branchName}` : ""} · {roleName}
                        </span>
                      </div>
                    </div>
                    <div className="account-dropdown__body">
                      {!demo && (
                        <>
                          <div className="account-dropdown__item">
                            <Link href="/profile">
                              <CircleUserRound size={14} aria-hidden="true" />Account
                            </Link>
                          </div>
                          <div className="account-dropdown__item">
                            <Link href="/notifications">
                              <Bell size={14} aria-hidden="true" />Notifications
                            </Link>
                          </div>
                        </>
                      )}
                      <div className="account-dropdown__item">
                        <Link href={demo ? "/demo/company" : "/company"}>
                          <Settings size={14} aria-hidden="true" />Settings
                        </Link>
                      </div>
                    </div>
                    <div className="account-dropdown__footer">
                      {demo ? (
                        <Link href="/login" className="account-dropdown__signout">
                          <Power size={14} aria-hidden="true" />Exit Demo
                        </Link>
                      ) : (
                        <form action={signOutAction}>
                          <button type="submit" className="account-dropdown__signout">
                            <Power size={14} aria-hidden="true" />Logout
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
