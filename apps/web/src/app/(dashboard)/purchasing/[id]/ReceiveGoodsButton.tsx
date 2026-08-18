"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast";
import { receivePurchaseOrderAction, initialPurchasingActionState } from "../actions";

export function ReceiveGoodsButton({ poId, warehouseId }: { poId: string; warehouseId: string }) {
  const [state, formAction, isPending] = useActionState(receivePurchaseOrderAction, initialPurchasingActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Goods received, stock updated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="poId" value={poId} />
      <input type="hidden" name="warehouseId" value={warehouseId} />
      <Button type="submit" loading={isPending}>
        Receive Goods
      </Button>
    </form>
  );
}
