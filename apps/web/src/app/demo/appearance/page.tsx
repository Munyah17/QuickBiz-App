"use client";

import { Card, CardHeader } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useDemo } from "@/lib/demo/DemoContext";
import { DEFAULT_THEME_COLOR } from "@/lib/theme";

const PRESET_COLORS = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706", "#0891b2", "#db2777", "#4f46e5"];

export default function DemoAppearancePage() {
  const { orgName, themeColor, updateThemeColor } = useDemo();
  const active = themeColor ?? DEFAULT_THEME_COLOR;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Appearance" />

      <Card>
        <CardHeader title="Theme Options" />
        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-text-secondary">
            Choose a brand color for {orgName}&apos;s workspace. It drives the sidebar and every primary button,
            link, and highlight.
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => updateThemeColor(color)}
                className="size-9 rounded-full border-2 transition-transform hover:scale-110"
                style={{ backgroundColor: color, borderColor: active === color ? "var(--color-text-primary)" : "transparent" }}
                aria-label={`Use ${color} as theme color`}
              />
            ))}
          </div>
          <p className="text-xs text-text-tertiary">Selected: {active}</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Custom CSS & HTML" />
        <div className="p-4">
          <p className="text-sm text-text-secondary">
            For per-line CSS/HTML overrides with version history, see{" "}
            <a href="/demo/custom-code" className="font-medium text-primary-600 hover:underline">
              Custom Code
            </a>
            .
          </p>
        </div>
      </Card>
    </div>
  );
}
