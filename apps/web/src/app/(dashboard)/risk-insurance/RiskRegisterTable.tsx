"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { NewRiskAssessmentModal } from "./NewRiskAssessmentModal";
import type { RiskAssessmentRow } from "@/services/riskInsurance";

const RISK_LEVEL_TONE: Record<RiskAssessmentRow["riskLevel"], "neutral" | "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

const RISK_STATUS_TONE: Record<RiskAssessmentRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  open: "warning",
  mitigating: "warning",
  mitigated: "success",
  accepted: "neutral",
  closed: "neutral",
};

export function RiskRegisterTable({ risks, canAssess }: { risks: RiskAssessmentRow[]; canAssess: boolean }) {
  return (
    <Card>
      <CardHeader title="Risk Register" action={canAssess && <NewRiskAssessmentModal />} />
      {risks.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No risks assessed yet" description="Record a risk assessment to start tracking mitigation." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Category</th>
              <th className="px-4 py-2.5">Risk Level</th>
              <th className="px-4 py-2.5">Score</th>
              <th className="px-4 py-2.5">Review Date</th>
              <th className="px-4 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{r.title}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.category?.replace("_", " ") ?? "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={RISK_LEVEL_TONE[r.riskLevel]}>{r.riskLevel}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{r.riskScore ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={RISK_STATUS_TONE[r.status]}>{r.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
