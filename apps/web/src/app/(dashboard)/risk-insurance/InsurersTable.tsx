"use client";

import { Building2 } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { NewInsurerModal } from "./NewInsurerModal";
import type { InsurerRow } from "@/services/riskInsurance";

export function InsurersTable({ insurers, canManage }: { insurers: InsurerRow[]; canManage: boolean }) {
  return (
    <Card>
      <CardHeader title="Insurers" action={canManage && <NewInsurerModal />} />
      {insurers.length === 0 ? (
        <EmptyState icon={Building2} title="No insurers yet" description="Add an insurer before creating policies." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Code</th>
              <th className="px-4 py-2.5">Contact</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {insurers.map((i) => (
              <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{i.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.code}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.contactPerson ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.email ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{i.phone ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={i.isActive ? "success" : "neutral"}>{i.isActive ? "active" : "inactive"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
