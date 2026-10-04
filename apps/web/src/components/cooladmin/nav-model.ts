import type { LucideIcon } from "lucide-react";
import {
  NAV_STRUCTURE,
  isNavGroup,
  type NavEntry,
  type NavLeaf,
} from "@/config/nav";

/**
 * NAV_STRUCTURE holds Lucide component references which can't cross the
 * Server -> Client boundary. The CoolAdmin shell is a client component, so it
 * imports the config itself and carries the components straight through —
 * no vendored icon font required.
 */
export interface CoolNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: CoolNavItem[];
}

export function buildNavModel(
  permissions: string[],
  enabledModules: string[],
  entries: NavEntry[] = NAV_STRUCTURE,
): CoolNavItem[] {
  const leafVisible = (leaf: NavLeaf) =>
    (!leaf.moduleKey || enabledModules.includes(leaf.moduleKey)) &&
    (!leaf.permission || permissions.includes(leaf.permission));

  const items: CoolNavItem[] = [];

  for (const entry of entries) {
    if (!isNavGroup(entry)) {
      if (!leafVisible(entry)) continue;
      items.push({
        key: entry.key,
        label: entry.label,
        icon: entry.icon,
        href: entry.href,
      });
      continue;
    }

    // A group's moduleKey gates the whole collapsible section — one group per
    // Module Store module, hidden entirely when that module isn't enabled.
    if (entry.moduleKey && !enabledModules.includes(entry.moduleKey)) continue;

    const children = entry.children.filter(leafVisible).map((child) => ({
      key: child.key,
      label: child.label,
      icon: child.icon,
      href: child.href,
    }));
    if (children.length === 0) continue;

    items.push({
      key: entry.key,
      label: entry.label,
      icon: entry.icon,
      children,
    });
  }

  return items;
}
