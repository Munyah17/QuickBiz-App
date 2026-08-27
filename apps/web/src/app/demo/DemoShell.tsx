"use client";

import { useDemo } from "@/lib/demo/DemoContext";
import { generateThemeVars } from "@/lib/theme";
import { DemoSidebar, DemoTopBar } from "./DemoNav";

export function DemoShell({ children }: { children: React.ReactNode }) {
  const { themeColor } = useDemo();
  const themeVars = generateThemeVars(themeColor);

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-workspace"
      style={themeVars ? (themeVars as React.CSSProperties) : undefined}
    >
      <DemoSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoTopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
