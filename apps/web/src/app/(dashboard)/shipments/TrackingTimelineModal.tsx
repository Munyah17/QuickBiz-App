"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { Badge } from "@/components/Badge";
import { useToast } from "@/components/Toast";
import { addShipmentEventAction, initialShipmentActionState } from "./actions";
import type { ShipmentEvent } from "@/services/logistics";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  pending: "neutral",
  dispatched: "info",
  in_transit: "info",
  delivered: "success",
  failed: "danger",
  returned: "danger",
};

function AddEventForm({ shipmentId, onClose }: { shipmentId: string; onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(addShipmentEventAction, initialShipmentActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Tracking event added");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <form action={formAction} className="flex flex-col gap-3 border-t border-border-subtle pt-4">
      <input type="hidden" name="shipmentId" value={shipmentId} />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status" htmlFor="eventStatus" required>
          <Select id="eventStatus" name="status" defaultValue="in_transit">
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
            <option value="returned">Returned</option>
          </Select>
        </FormField>
        <FormField label="Location" htmlFor="eventLocation" hint="Optional">
          <Input id="eventLocation" name="location" placeholder="e.g. Harare depot" />
        </FormField>
      </div>
      <FormField label="Note" htmlFor="eventNote" hint="Optional">
        <Textarea id="eventNote" name="note" rows={2} placeholder="e.g. handed to courier, delayed at border" />
      </FormField>
      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={isPending}>
          Add event
        </Button>
      </div>
    </form>
  );
}

export function TrackingTimelineModal({
  shipmentId,
  shipmentNumber,
  events,
  canManage,
}: {
  shipmentId: string;
  shipmentNumber: string;
  events: ShipmentEvent[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Timeline
      </Button>
      {open && (
        <Modal open onClose={() => { setOpen(false); setAdding(false); }} title={`Tracking — ${shipmentNumber}`}>
          <div className="flex flex-col gap-4">
            {events.length === 0 ? (
              <p className="text-sm text-text-tertiary">No tracking events yet. Status changes and manual updates appear here.</p>
            ) : (
              <ol className="relative flex flex-col gap-4 border-l border-border-subtle pl-5">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[26px] top-1 size-2.5 rounded-full bg-primary-500" />
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[e.status] ?? "neutral"}>{e.status.replace("_", " ")}</Badge>
                      <span className="text-xs text-text-tertiary">{new Date(e.occurred_at).toLocaleString()}</span>
                    </div>
                    {(e.location || e.note) && (
                      <p className="mt-1 text-sm text-text-secondary">
                        {e.location && <span className="font-medium">{e.location}</span>}
                        {e.location && e.note && " — "}
                        {e.note}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}

            {canManage && !adding && (
              <div className="flex justify-end border-t border-border-subtle pt-3">
                <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
                  Add tracking event
                </Button>
              </div>
            )}
            {canManage && adding && <AddEventForm shipmentId={shipmentId} onClose={() => setAdding(false)} />}
          </div>
        </Modal>
      )}
    </>
  );
}
