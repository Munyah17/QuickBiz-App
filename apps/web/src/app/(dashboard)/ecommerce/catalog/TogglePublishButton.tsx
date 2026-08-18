"use client";

import { useActionState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/Button";
import { setOnlineProductPublishedAction, initialOnlineProductActionState } from "./actions";

export function TogglePublishButton({ onlineProductId, isPublished }: { onlineProductId: string; isPublished: boolean }) {
  const [state, formAction, isPending] = useActionState(setOnlineProductPublishedAction, initialOnlineProductActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="onlineProductId" value={onlineProductId} />
      <input type="hidden" name="isPublished" value={String(isPublished)} />
      <Button type="submit" variant="secondary" size="sm" loading={isPending}>
        {isPublished ? "Unpublish" : "Publish"}
      </Button>
    </form>
  );
}
