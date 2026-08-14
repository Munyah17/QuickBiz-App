"use client";

import { useActionState, useEffect } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { updateProfileAction, initialProfileActionState } from "./actions";

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialProfileActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Profile updated");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Card>
      <CardHeader title="Your profile" />
      <form action={formAction} className="flex flex-col gap-4 p-4">
        <FormField label="Full name" htmlFor="fullName" required>
          <Input id="fullName" name="fullName" required defaultValue={fullName} />
        </FormField>

        <FormField label="Email" htmlFor="email" hint="Contact support to change your sign-in email.">
          <Input id="email" value={email} disabled />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end pt-2">
          <Button type="submit" loading={isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}
