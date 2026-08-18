"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Input";
import { useToast } from "@/components/Toast";
import { addTicketCommentAction, initialTicketActionState } from "../actions";
import type { TicketComment } from "@/services/tickets";

function AddCommentForm({ ticketId }: { ticketId: string }) {
  const [state, formAction, isPending] = useActionState(addTicketCommentAction, initialTicketActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-2 border-t border-border-subtle p-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Textarea name="body" placeholder="Add an update..." required />
      <Button type="submit" size="sm" loading={isPending} className="w-fit self-end">
        Post comment
      </Button>
    </form>
  );
}

export function CommentThread({ ticketId, comments, canManage }: { ticketId: string; comments: TicketComment[]; canManage: boolean }) {
  return (
    <div>
      {comments.length === 0 ? (
        <p className="p-4 text-sm text-text-secondary">No updates yet.</p>
      ) : (
        <ul className="flex flex-col">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border-subtle px-4 py-3 last:border-b-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">{c.authorName ?? "Unknown"}</span>
                <span className="text-xs text-text-tertiary">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      {canManage && <AddCommentForm ticketId={ticketId} />}
    </div>
  );
}
