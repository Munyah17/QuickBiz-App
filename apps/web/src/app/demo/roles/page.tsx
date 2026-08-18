"use client";

import { Check, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { useDemo, DEMO_PERMISSIONS } from "@/lib/demo/DemoContext";

export default function DemoRolesPage() {
  const { roles, toggleRolePermission } = useDemo();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Roles" />

      <p className="text-sm text-text-tertiary">
        System roles (Owner, Manager, Team Leader) keep a fixed permission set. Custom roles, like &quot;Warehouse
        Lead&quot; below, can have any permission toggled on or off.
      </p>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Role</th>
                {DEMO_PERMISSIONS.map((p) => (
                  <th key={p.key} className="px-4 py-2.5 text-center">
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-text-primary">{r.name}</p>
                    <Badge tone={r.isSystem ? "neutral" : "info"} className="mt-1">
                      {r.isSystem ? "System" : "Custom"}
                    </Badge>
                  </td>
                  {DEMO_PERMISSIONS.map((p) => {
                    const has = r.permissions.has(p.key);
                    return (
                      <td key={p.key} className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          disabled={r.isSystem}
                          onClick={() => toggleRolePermission(r.id, p.key)}
                          className="inline-flex size-6 items-center justify-center rounded-md border border-border transition-colors disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:border-primary-400"
                          aria-label={`Toggle ${p.label} for ${r.name}`}
                        >
                          {has ? (
                            <Check className="size-4 text-primary-600" />
                          ) : r.isSystem ? (
                            <Lock className="size-3 text-text-tertiary" />
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
