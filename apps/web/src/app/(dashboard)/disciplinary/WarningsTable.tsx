"use client";

import { FileWarning } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { NewWarningModal } from "./NewWarningModal";
import type { DisciplinaryWarningRow } from "@/services/disciplinary";

const WARNING_TONE: Record<DisciplinaryWarningRow["warningType"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  verbal: "neutral",
  written: "warning",
  final: "danger",
};

export function WarningsTable({ warnings, employees, canManage }: { warnings: DisciplinaryWarningRow[]; employees: Array<{ id: string; fullName: string }>; canManage: boolean }) {
  return (
    <Card>
      <CardHeader title="Warnings" action={canManage && <NewWarningModal employees={employees} />} />
      {warnings.length === 0 ? (
        <EmptyState icon={FileWarning} title="No warnings issued" description="Warnings issued to employees will appear here." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Employee</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Reason</th>
              <th className="px-4 py-2.5">Issued</th>
              <th className="px-4 py-2.5">Expires</th>
              <th className="px-4 py-2.5">Acknowledged</th>
            </tr>
          </thead>
          <tbody>
            {warnings.map((w) => (
              <tr key={w.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{w.employeeName}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={WARNING_TONE[w.warningType]}>{w.warningType}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{w.reason}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(w.issuedDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-text-secondary">{w.expiresDate ? new Date(w.expiresDate).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={w.acknowledged ? "success" : "neutral"}>{w.acknowledged ? "Yes" : "No"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
