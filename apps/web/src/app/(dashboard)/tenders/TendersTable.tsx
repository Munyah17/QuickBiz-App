"use client";

import { useEffect, useState } from "react";
import { Gavel } from "lucide-react";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SubmitBidModal } from "./SubmitBidModal";
import { AwardTenderModal } from "./AwardTenderModal";
import { listTenderBidsAction } from "./actions";
import type { TenderRow, TenderBidRow } from "@/services/tenders";
import type { Supplier } from "@/services/purchasing";

const TENDER_STATUS_TONE: Record<TenderRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  published: "warning",
  closed: "neutral",
  awarded: "success",
  cancelled: "danger",
};

const BID_STATUS_TONE: Record<TenderBidRow["status"], "neutral" | "success" | "warning" | "danger"> = {
  submitted: "neutral",
  under_review: "warning",
  shortlisted: "warning",
  rejected: "danger",
  awarded: "success",
  withdrawn: "danger",
};

function BidsModal({
  tender,
  suppliers,
  canBid,
  canEvaluate,
  onClose,
}: {
  tender: TenderRow;
  suppliers: Supplier[];
  canBid: boolean;
  canEvaluate: boolean;
  onClose: () => void;
}) {
  const [bids, setBids] = useState<TenderBidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitBidOpen, setSubmitBidOpen] = useState(false);
  const [awardBid, setAwardBid] = useState<TenderBidRow | null>(null);

  function reload() {
    setLoading(true);
    listTenderBidsAction(tender.id)
      .then(setBids)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Initial load: loading is already true — fetch without a
    // synchronous setState so this stays a pure external sync.
    listTenderBidsAction(tender.id)
      .then(setBids)
      .finally(() => setLoading(false));
  }, [tender.id]);

  const canAward = canEvaluate && tender.status !== "awarded" && tender.status !== "cancelled";

  return (
    <Modal open onClose={onClose} title={`Bids for ${tender.tenderNumber}`}>
      <div className="flex flex-col gap-4">
        {canBid && tender.status === "published" && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setSubmitBidOpen(true)}>
              Submit Bid
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-text-tertiary">Loading bids...</p>
        ) : bids.length === 0 ? (
          <p className="text-sm text-text-tertiary">No bids submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-2 py-2">Supplier</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Status</th>
                {canAward && <th className="px-2 py-2" />}
              </tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-2 py-2 font-medium text-text-primary">{b.supplierName}</td>
                  <td className="px-2 py-2 text-text-secondary">
                    {b.currency} {b.amount.toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <Badge tone={BID_STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
                  </td>
                  {canAward && (
                    <td className="px-2 py-2">
                      {b.status !== "awarded" && b.status !== "rejected" && (
                        <Button variant="secondary" size="sm" onClick={() => setAwardBid(b)}>
                          Award
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {submitBidOpen && (
        <SubmitBidModal
          tenderId={tender.id}
          suppliers={suppliers}
          onClose={() => setSubmitBidOpen(false)}
          onSubmitted={reload}
        />
      )}

      {awardBid && (
        <AwardTenderModal tenderId={tender.id} bid={awardBid} onClose={() => setAwardBid(null)} onAwarded={reload} />
      )}
    </Modal>
  );
}

export function TendersTable({
  tenders,
  suppliers,
  canBid,
  canEvaluate,
}: {
  tenders: TenderRow[];
  suppliers: Supplier[];
  canBid: boolean;
  canEvaluate: boolean;
}) {
  const [viewTender, setViewTender] = useState<TenderRow | null>(null);

  return (
    <Card>
      {tenders.length === 0 ? (
        <EmptyState icon={Gavel} title="No tenders yet" description="Create a tender to start receiving supplier bids." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Tender</th>
              <th className="px-4 py-2.5">Title</th>
              <th className="px-4 py-2.5">Closing Date</th>
              <th className="px-4 py-2.5">Budget</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {tenders.map((t) => (
              <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{t.tenderNumber}</td>
                <td className="px-4 py-2.5 text-text-secondary">{t.title}</td>
                <td className="px-4 py-2.5 text-text-secondary">{new Date(t.closingDate).toLocaleDateString()}</td>
                <td className="px-4 py-2.5 text-text-secondary">{t.budget ? t.budget.toFixed(2) : "-"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={TENDER_STATUS_TONE[t.status]}>{t.status}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <Button variant="secondary" size="sm" onClick={() => setViewTender(t)}>
                    View Bids
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewTender && (
        <BidsModal
          tender={viewTender}
          suppliers={suppliers}
          canBid={canBid}
          canEvaluate={canEvaluate}
          onClose={() => setViewTender(null)}
        />
      )}
    </Card>
  );
}
