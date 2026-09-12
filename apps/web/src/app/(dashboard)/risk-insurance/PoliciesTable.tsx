"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { NewPolicyModal } from "./NewPolicyModal";
import { SubmitClaimModal } from "./SubmitClaimModal";
import { listPolicyClaimsAction } from "./actions";
import type { PolicyRow, ClaimRow, InsurerRow } from "@/services/riskInsurance";
import type { AssetRow } from "@/services/assets";
import type { VehicleRow } from "@/services/fleet";

const POLICY_STATUS_TONE: Record<PolicyRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  active: "success",
  expired: "danger",
  cancelled: "danger",
  pending_renewal: "warning",
};

const CLAIM_STATUS_TONE: Record<ClaimRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  submitted: "neutral",
  under_review: "warning",
  approved: "success",
  rejected: "danger",
  paid: "success",
  closed: "neutral",
};

function ClaimsModal({
  policy,
  canClaim,
  onClose,
}: {
  policy: PolicyRow;
  canClaim: boolean;
  onClose: () => void;
}) {
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitClaimOpen, setSubmitClaimOpen] = useState(false);

  function reload() {
    setLoading(true);
    listPolicyClaimsAction(policy.id)
      .then(setClaims)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy.id]);

  return (
    <Modal open onClose={onClose} title={`Claims for ${policy.policyNumber}`}>
      <div className="flex flex-col gap-4">
        {canClaim && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setSubmitClaimOpen(true)}>
              Submit Claim
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-tertiary">Loading claims...</p>
        ) : claims.length === 0 ? (
          <p className="text-sm text-text-tertiary">No claims submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-2 py-2">Claim</th>
                <th className="px-2 py-2">Incident</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-2 py-2 font-medium text-text-primary">{c.claimNumber}</td>
                  <td className="px-2 py-2 text-text-secondary">{new Date(c.incidentDate).toLocaleDateString()}</td>
                  <td className="px-2 py-2 text-text-secondary">
                    {c.currency} {c.claimAmount.toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <Badge tone={CLAIM_STATUS_TONE[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {submitClaimOpen && (
        <SubmitClaimModal policyId={policy.id} onClose={() => setSubmitClaimOpen(false)} onSubmitted={reload} />
      )}
    </Modal>
  );
}

export function PoliciesTable({
  policies,
  insurers,
  assets,
  vehicles,
  canManage,
  canClaim,
}: {
  policies: PolicyRow[];
  insurers: InsurerRow[];
  assets: AssetRow[];
  vehicles: VehicleRow[];
  canManage: boolean;
  canClaim: boolean;
}) {
  const [viewPolicy, setViewPolicy] = useState<PolicyRow | null>(null);

  return (
    <Card>
      <CardHeader title="Insurance Policies" action={canManage && <NewPolicyModal insurers={insurers} assets={assets} vehicles={vehicles} />} />
      {policies.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No policies yet" description="Create a policy to cover an asset, vehicle, or operation." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Policy</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Insurer</th>
              <th className="px-4 py-2.5">Premium</th>
              <th className="px-4 py-2.5">End Date</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{p.policyNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">{p.policyType.replace("_", " ")}</td>
                <td className="px-4 py-2.5 text-text-secondary">{p.insurerName}</td>
                <td className="px-4 py-2.5 text-text-secondary">{p.premium.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(p.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={POLICY_STATUS_TONE[p.status]}>{p.status.replace("_", " ")}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Button variant="secondary" size="sm" onClick={() => setViewPolicy(p)}>
                    View Claims
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewPolicy && <ClaimsModal policy={viewPolicy} canClaim={canClaim} onClose={() => setViewPolicy(null)} />}
    </Card>
  );
}
