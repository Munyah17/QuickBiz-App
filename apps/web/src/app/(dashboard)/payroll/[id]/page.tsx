import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getPayrollRun } from "@/services/payroll";
import { RunStatusActions } from "./RunStatusActions";
import { PayslipPrintArea } from "./PayslipPrintArea";

const statusTone: Record<string, "success" | "info" | "neutral"> = {
  draft: "neutral",
  finalized: "info",
  paid: "success",
};

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, orgName, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "payroll");
  const canManage = permissions.has("payroll.manage");
  if (!canManage) notFound();

  const run = await getPayrollRun(supabase, orgId, id);
  if (!run) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Payroll" title={`Run ${run.run_number}`} />
        <RunStatusActions runId={run.id} status={run.status} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={statusTone[run.status] ?? "neutral"}>{run.status}</Badge>
        <span className="text-sm text-text-secondary">
          {new Date(run.period_start).toLocaleDateString()} to {new Date(run.period_end).toLocaleDateString()}
          {run.pay_date && ` · Pay date ${new Date(run.pay_date).toLocaleDateString()}`}
          {run.branchName && ` · ${run.branchName}`}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total gross" value={`$${run.total_gross.toFixed(2)}`} tone="primary" />
        <StatCard label="Total deductions" value={`$${run.total_deductions.toFixed(2)}`} tone="warning" />
        <StatCard label="Total net pay" value={`$${run.total_net.toFixed(2)}`} tone="success" />
      </div>

      <Card>
        <CardHeader title={`${run.payslips.length} payslips`} />
        {run.payslips.length === 0 ? (
          <div className="p-6 text-sm text-text-tertiary">No payslips on this run.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Employee</th>
                <th className="px-4 py-2.5">Basic</th>
                <th className="px-4 py-2.5">Gross</th>
                <th className="px-4 py-2.5">PAYE</th>
                <th className="px-4 py-2.5">NSSA</th>
                <th className="px-4 py-2.5">AIDS Levy</th>
                <th className="px-4 py-2.5">Other ded.</th>
                <th className="px-4 py-2.5">Net pay</th>
              </tr>
            </thead>
            <tbody>
              {run.payslips.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-text-primary">{p.employeeName}</p>
                    <p className="text-xs text-text-tertiary">{p.employeeNumber}</p>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.basicSalary.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.grossPay.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.payeAmount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.nssaEmployeeAmount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.aidsLevyAmount.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.otherDeductions.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-semibold text-text-primary">${p.netPay.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {run.notes && (
        <Card>
          <CardHeader title="Notes" />
          <p className="p-4 text-sm text-text-secondary">{run.notes}</p>
        </Card>
      )}

      <PayslipPrintArea run={run} orgName={orgName} />
    </div>
  );
}
