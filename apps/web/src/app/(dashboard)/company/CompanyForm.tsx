"use client";

import { useActionState, useEffect } from "react";
import { updateCompanyAction, initialCompanyActionState } from "./actions";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import type { Currency } from "@/services/org";

export function CompanyForm({
  name,
  legalName,
  currency,
  timezone,
  phone,
  taxRate,
  currencies,
  canManage,
}: {
  name: string;
  legalName: string;
  currency: string;
  timezone: string;
  phone: string;
  taxRate: string;
  currencies: Currency[];
  canManage: boolean;
}) {
  const [state, formAction, isPending] = useActionState(updateCompanyAction, initialCompanyActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Company profile updated");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Card>
      <CardHeader title="Company profile" />
      <form action={formAction} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Company name" htmlFor="name" required>
            <Input id="name" name="name" required defaultValue={name} disabled={!canManage} />
          </FormField>
          <FormField label="Legal name" htmlFor="legal_name">
            <Input id="legal_name" name="legal_name" defaultValue={legalName} disabled={!canManage} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Currency" htmlFor="currency">
            <Select id="currency" name="currency" defaultValue={currency} disabled={!canManage}>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.name})
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Timezone" htmlFor="timezone">
            <Input id="timezone" name="timezone" defaultValue={timezone} disabled={!canManage} />
          </FormField>
          <FormField label="Default tax rate" htmlFor="tax_rate" hint="e.g. 15%">
            <Input id="tax_rate" name="tax_rate" defaultValue={taxRate} disabled={!canManage} />
          </FormField>
        </div>

        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={phone} disabled={!canManage} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        {canManage && (
          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isPending}>
              Save changes
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}
