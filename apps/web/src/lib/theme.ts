// Generates a full per-tenant theme (sidebar + primary accent shades) from a
// single seed hex color, so a tenant only ever has to pick one color. All
// derived values are CSS custom-property overrides — Tailwind v4's generated
// utilities (e.g. `.bg-primary-600 { background-color: var(--color-primary-600) }`)
// already reference these variables, so overriding them at the layout root
// re-themes every component with zero per-component changes.

export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_THEME_COLOR = "#2563eb";

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: l * 100 };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex({ h, s, l }: Hsl): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function shade(base: Hsl, { h = base.h, s, l }: { h?: number; s: number; l: number }): string {
  return hslToHex({ h, s: clamp(s, 0, 100), l: clamp(l, 0, 100) });
}

export interface ThemeVars {
  "--color-sidebar": string;
  "--color-sidebar-elevated": string;
  "--color-sidebar-border": string;
  "--color-sidebar-text": string;
  "--color-sidebar-heading": string;
  "--color-primary-50": string;
  "--color-primary-100": string;
  "--color-primary-500": string;
  "--color-primary-600": string;
  "--color-primary-700": string;
  // CoolAdmin overlay tokens (app.css) — the dashboard shell is driven by
  // --m-* vars, so the tenant color re-themes it too.
  "--m-accent": string;
  "--m-accent-rgb": string;
  "--m-accent-hover": string;
  "--m-accent-soft": string;
  "--m-sidebar": string;
  "--m-sidebar-soft": string;
}

function hexToRgbTriplet(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export function generateThemeVars(hexInput: string | null | undefined): ThemeVars | null {
  if (!hexInput || !HEX_PATTERN.test(hexInput)) return null;

  const base = hexToHsl(hexInput);

  return {
    // Dark, desaturated-toward-navy shades of the tenant's hue for the sidebar.
    "--color-sidebar": shade(base, { s: clamp(base.s * 0.65, 15, 45), l: 9 }),
    "--color-sidebar-elevated": shade(base, { s: clamp(base.s * 0.65, 15, 45), l: 15 }),
    "--color-sidebar-border": shade(base, { s: clamp(base.s * 0.6, 10, 40), l: 21 }),
    "--color-sidebar-text": shade(base, { s: clamp(base.s * 0.3, 5, 20), l: 65 }),
    "--color-sidebar-heading": shade(base, { s: clamp(base.s * 0.2, 5, 15), l: 50 }),
    // Primary accent shades built around the tenant's color as the "600" step.
    "--color-primary-50": shade(base, { s: clamp(base.s * 0.5, 20, 60), l: 96 }),
    "--color-primary-100": shade(base, { s: clamp(base.s * 0.55, 25, 65), l: 91 }),
    "--color-primary-500": shade(base, { s: base.s, l: clamp(base.l + 8, 0, 62) }),
    "--color-primary-600": hexInput,
    "--color-primary-700": shade(base, { s: base.s, l: clamp(base.l - 11, 14, 100) }),
    // CoolAdmin overlay mirrors the same palette.
    "--m-accent": shade(base, { s: base.s, l: clamp(base.l + 8, 0, 62) }),
    "--m-accent-rgb": hexToRgbTriplet(
      shade(base, { s: base.s, l: clamp(base.l + 8, 0, 62) }),
    ),
    "--m-accent-hover": hexInput,
    "--m-accent-soft": shade(base, { s: clamp(base.s * 0.5, 20, 60), l: 96 }),
    "--m-sidebar": shade(base, { s: clamp(base.s * 0.65, 15, 45), l: 9 }),
    "--m-sidebar-soft": shade(base, { s: clamp(base.s * 0.65, 15, 45), l: 15 }),
  };
}
