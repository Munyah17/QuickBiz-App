"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { NotificationRow } from "@/services/notifications";
import { buildNavModel } from "./nav-model";
import { CoolAdminSidebar } from "./CoolAdminSidebar";
import { CoolAdminHeader } from "./CoolAdminHeader";

const MOBILE_BP = 992;

/**
 * CoolAdmin page shell — `.page-wrapper` > `.menu-sidebar` + `.page-container`
 * (`header-desktop` + `.main-content`). Ported to React state:
 *   - `body.app`                — opts the page into the app.css overlay
 *   - `body.sidebar-collapsed`  — desktop icon rail (>= 992px)
 *   - `body.sidebar-open`       — mobile off-canvas drawer (< 992px)
 * The legacy `.header-mobile`/`.navbar-mobile` block is intentionally omitted:
 * the app theme hides it (`display: none !important`) in favor of this
 * unified drawer.
 */
export function CoolAdminShell({
  children,
  permissions,
  enabledModules,
  orgName,
  branchName,
  userName,
  roleName,
  email,
  notifications,
}: {
  children: React.ReactNode;
  permissions: string[];
  enabledModules: string[];
  orgName: string;
  branchName: string;
  userName: string;
  roleName: string;
  email: string;
  notifications: NotificationRow[];
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const model = useMemo(
    () => buildNavModel(permissions, enabledModules),
    [permissions, enabledModules],
  );

  // `body.app` is set in the root layout so the overlay applies from first
  // paint; here we only sync the two interactive state classes.
  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
  }, [collapsed]);

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", mobileOpen);
  }, [mobileOpen]);

  // Route change closes the mobile drawer (template closes it on link tap).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes the drawer; crossing the breakpoint clears mobile state.
  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    let timer: ReturnType<typeof setTimeout>;
    function onResize() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (window.innerWidth >= MOBILE_BP) setMobileOpen(false);
      }, 120);
    }
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeydown);
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
    };
  }, []);

  // Unified toggle: icon rail on desktop, off-canvas drawer on mobile —
  // exactly what the template's `.js-sidebar-toggle` handler does.
  const toggleSidebar = () => {
    if (window.innerWidth < MOBILE_BP) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  };

  return (
    <div className="page-wrapper">
      <a className="visually-hidden-focusable skip-link" href="#main-content">
        Skip to main content
      </a>
      <CoolAdminSidebar
        model={model}
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)}
        onClose={() => setMobileOpen(false)}
      />
      <div
        className="sidebar-backdrop"
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      />
      <div className="page-container">
        <CoolAdminHeader
          userName={userName}
          roleName={roleName}
          email={email}
          orgName={orgName}
          branchName={branchName}
          notifications={notifications}
          onToggleSidebar={toggleSidebar}
          sidebarExpanded={mobileOpen || !collapsed}
        />
        <main className="main-content" id="main-content">
          <div className="section__content section__content--p30">
            <div className="container-fluid">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
