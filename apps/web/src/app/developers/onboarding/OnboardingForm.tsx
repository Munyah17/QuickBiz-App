"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createDeveloperProfile, initialDevActionState } from "../actions";

export function OnboardingForm({ defaultEmail }: { defaultEmail: string }) {
  const [state, formAction, isPending] = useActionState(createDeveloperProfile, initialDevActionState);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Display name</label>
        <Input name="displayName" required placeholder="Your name or studio name" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Company (optional)</label>
        <Input name="companyName" placeholder="Company or team" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-secondary">Email</label>
        <Input value={defaultEmail} disabled />
      </div>
      {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
      <Button type="submit" loading={isPending}>
        Create developer profile
      </Button>
    </form>
  );
}
