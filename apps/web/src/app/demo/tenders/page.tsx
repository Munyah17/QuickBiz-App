"use client";

import { useState } from "react";
import { Plus, Gavel } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoTender, type DemoTenderBid } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const TENDER_STATUS_TONE: Record<DemoTender["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  published: "warning",
  closed: "neutral",
  awarded: "success",
  cancelled: "danger",
};

const BID_STATUS_TONE: Record<DemoTenderBid["status"], "neutral" | "success" | "warning" | "danger"> = {
  submitted: "neutral",
  under_review: "warning",
  shortlisted: "warning",
  rejected: "danger",
  awarded: "success",
  withdrawn: "danger",
};

function NewTenderModal({ onClose }: { onClose: () => void }) {
  const { createTender } = useDemo();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");

  return (
    <Modal open onClose={onClose} title="New Tender">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createTender({
            title: title.trim(),
            closingDate: new Date(closingDate).toISOString(),
            estimatedValue: Number(estimatedValue) || 0,
          });
          push("Tender created");
          onClose();
        }}
      >
        <FormField label="Title" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>

        <FormField label="Closing Date" htmlFor="closingDate">
          <Input id="closingDate" type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} required />
        </FormField>

        <FormField label="Estimated Value" htmlFor="estimatedValue">
          <Input
            id="estimatedValue"
            type="number"
            step="0.01"
            min={0}
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Tender</Button>
        </div>
      </form>
    </Modal>
  );
}

function SubmitBidModal({ tenderId, onClose }: { tenderId: string; onClose: () => void }) {
  const { submitBid } = useDemo();
  const { push } = useToast();
  const [supplierName, setSupplierName] = useState("");
  const [bidAmount, setBidAmount] = useState("");

  return (
    <Modal open onClose={onClose} title="Submit Bid">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitBid(tenderId, supplierName.trim(), Number(bidAmount) || 0);
          push("Bid submitted");
          onClose();
        }}
      >
        <FormField label="Supplier Name" htmlFor="supplierName">
          <Input id="supplierName" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} required />
        </FormField>

        <FormField label="Bid Amount" htmlFor="bidAmount">
          <Input id="bidAmount" type="number" step="0.01" min={0} value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit Bid</Button>
        </div>
      </form>
    </Modal>
  );
}

function BidsModal({ tender, onClose }: { tender: DemoTender; onClose: () => void }) {
  const { tenderBids, awardTender } = useDemo();
  const { push } = useToast();
  const [submitBidOpen, setSubmitBidOpen] = useState(false);
  const bids = tenderBids.filter((b) => b.tenderId === tender.id);
  const canAward = tender.status !== "awarded" && tender.status !== "cancelled";

  return (
    <Modal open onClose={onClose} title={`Bids for ${tender.tenderNumber}`}>
      <div className="flex flex-col gap-4">
        {tender.status === "published" && (
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setSubmitBidOpen(true)}>
              Submit Bid
            </Button>
          </div>
        )}

        {bids.length === 0 ? (
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
                  <td className="px-2 py-2 text-text-secondary">{b.bidAmount.toFixed(2)}</td>
                  <td className="px-2 py-2">
                    <Badge tone={BID_STATUS_TONE[b.status]}>{b.status.replace("_", " ")}</Badge>
                  </td>
                  {canAward && (
                    <td className="px-2 py-2">
                      {b.status !== "awarded" && b.status !== "rejected" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            awardTender(tender.id, b.id);
                            push("Tender awarded");
                          }}
                        >
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

      {submitBidOpen && <SubmitBidModal tenderId={tender.id} onClose={() => setSubmitBidOpen(false)} />}
    </Modal>
  );
}

export default function DemoTendersPage() {
  const { tenders } = useDemo();
  const [newTenderOpen, setNewTenderOpen] = useState(false);
  const [viewTender, setViewTender] = useState<DemoTender | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Operations" title="Tenders" />
        <Button onClick={() => setNewTenderOpen(true)}>
          <Plus className="size-4" />
          New Tender
        </Button>
      </div>

      <p className="text-sm text-text-tertiary">
        Track tenders you are running to source suppliers, receive and evaluate bids, and award the winning bid.
      </p>

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
                <th className="px-4 py-2.5">Estimated Value</th>
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
                  <td className="px-4 py-2.5 text-text-secondary">{t.estimatedValue.toFixed(2)}</td>
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
      </Card>

      {newTenderOpen && <NewTenderModal onClose={() => setNewTenderOpen(false)} />}
      {viewTender && <BidsModal tender={viewTender} onClose={() => setViewTender(null)} />}
    </div>
  );
}
