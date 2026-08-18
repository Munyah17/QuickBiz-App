"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { updateOnlineOrderStatusAction, updateOnlineOrderDeliveryStatusAction, initialOnlineOrderActionState } from "./actions";

const STATUSES = ["pending", "confirmed", "fulfilled", "cancelled"];
const DELIVERY_STATUSES = ["not_shipped", "shipped", "delivered"];

export function OrderStatusControls({
  orderId,
  status,
  deliveryStatus,
}: {
  orderId: string;
  status: string;
  deliveryStatus: string;
}) {
  const [statusState, statusAction, statusPending] = useActionState(updateOnlineOrderStatusAction, initialOnlineOrderActionState);
  const [deliveryState, deliveryAction, deliveryPending] = useActionState(
    updateOnlineOrderDeliveryStatusAction,
    initialOnlineOrderActionState
  );
  const { push } = useToast();

  useEffect(() => {
    if (statusState.error) push(statusState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusState.error]);

  useEffect(() => {
    if (deliveryState.error) push(deliveryState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryState.error]);

  return (
    <div className="flex items-center gap-2">
      <form action={statusAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <select
          name="status"
          defaultValue={status}
          disabled={statusPending}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </form>

      <form action={deliveryAction}>
        <input type="hidden" name="orderId" value={orderId} />
        <select
          name="deliveryStatus"
          defaultValue={deliveryStatus}
          disabled={deliveryPending}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none disabled:opacity-50"
        >
          {DELIVERY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}
