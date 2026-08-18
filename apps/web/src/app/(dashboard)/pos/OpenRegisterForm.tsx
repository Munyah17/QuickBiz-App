"use client";

import { useActionState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { openSessionAction, initialPosActionState } from "./actions";

export function OpenRegisterForm({ registerId, registerName }: { registerId: string; registerName: string }) {
  const [state, formAction, isPending] = useActionState(openSessionAction, initialPosActionState);

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader title={`Open ${registerName}`} />
      <form action={formAction} className="flex flex-col gap-4 p-4">
        <input type="hidden" name="registerId" value={registerId} />
        <FormField label="Opening float" htmlFor="openingFloat" hint="Cash counted in the drawer before selling">
          <Input id="openingFloat" name="openingFloat" type="number" min="0" step="0.01" defaultValue={0} />
        </FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <Button type="submit" loading={isPending}>
          Open register
        </Button>
      </form>
    </Card>
  );
}
