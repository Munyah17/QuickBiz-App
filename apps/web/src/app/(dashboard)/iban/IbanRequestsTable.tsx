import { Landmark } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import type { IbanRequestRow } from "@/services/iban";

const STATUS_TONE: Record<IbanRequestRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  active: "success",
  suspended: "neutral",
  closed: "danger",
};

export function IbanRequestsTable({ requests }: { requests: IbanRequestRow[] }) {
  return (
    <Card>
      {requests.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No IBAN requests yet"
          description="Request an IBAN to start showing international customers a bank account they recognize."
        />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">IBAN</th>
              <th className="px-4 py-2.5">Bank</th>
              <th className="px-4 py-2.5">Currency</th>
              <th className="px-4 py-2.5">Balance</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Requested</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-mono text-text-secondary">{r.iban ?? "Not yet issued"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.bankName ?? "-"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{r.currency}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {r.balance.toFixed(2)} {r.currency}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
