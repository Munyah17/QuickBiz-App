"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "./actions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import type { ActionState } from "@/app/actions/auth";
import { Package } from "lucide-react";

const initialState: ActionState = { error: null };

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(createOrganizationAction, initialState);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-workspace px-4">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary-600">
          <Package className="size-5 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary">QuickBiz ERP</span>
      </div>
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-card">
        <h1 className="mb-1 text-lg font-semibold text-text-primary">Create your organization</h1>
        <p className="mb-5 text-sm text-text-secondary">You&apos;re signed in, but not part of a workspace yet.</p>

        <form action={formAction} className="flex flex-col gap-4">
          <FormField label="Company name" htmlFor="companyName" required>
            <Input id="companyName" name="companyName" required autoFocus />
          </FormField>

          {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

          <Button type="submit" loading={isPending} className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
