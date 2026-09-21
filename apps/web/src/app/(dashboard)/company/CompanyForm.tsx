"use client";

import { useActionState, useEffect } from "react";
import { updateCompanyAction, initialCompanyActionState } from "./actions";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import type { Currency } from "@/services/org";

export function CompanyForm({
  name,
  legalName,
  currency,
  timezone,
  phone,
  email,
  website,
  address,
  logoUrl,
  taxNumber,
  bankDetails,
  terms,
  taxRate,
  invoiceFooter,
  currencies,
  canManage,
}: {
  name: string;
  legalName: string;
  currency: string;
  timezone: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logoUrl: string;
  taxNumber: string;
  bankDetails: string;
  terms: string;
  taxRate: string;
  invoiceFooter: string;
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

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={phone} disabled={!canManage} />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" name="email" type="email" defaultValue={email} disabled={!canManage} />
          </FormField>
          <FormField label="Website" htmlFor="website">
            <Input id="website" name="website" defaultValue={website} disabled={!canManage} placeholder="https://" />
          </FormField>
        </div>

        <FormField label="Physical / postal address" htmlFor="address" hint="Printed on document letterheads">
          <Textarea id="address" name="address" rows={2} defaultValue={address} disabled={!canManage} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Logo URL" htmlFor="logo_url" hint="Public image URL — printed on invoices, quotes and POs">
            <Input id="logo_url" name="logo_url" defaultValue={logoUrl} disabled={!canManage} placeholder="https://…/logo.png" />
          </FormField>
          <FormField label="Tax / VAT number" htmlFor="tax_number" hint="Shown on tax invoices">
            <Input id="tax_number" name="tax_number" defaultValue={taxNumber} disabled={!canManage} />
          </FormField>
        </div>

        <FormField
          label="Banking details"
          htmlFor="bank_details"
          hint="Printed on invoices so customers know where to pay — bank, branch, account, reference"
        >
          <Textarea id="bank_details" name="bank_details" rows={3} defaultValue={bankDetails} disabled={!canManage} />
        </FormField>

        <FormField
          label="Terms & conditions"
          htmlFor="terms"
          hint="Printed at the bottom of invoices, quotations and purchase orders"
        >
          <Textarea id="terms" name="terms" rows={3} defaultValue={terms} disabled={!canManage} />
        </FormField>

        <FormField
          label="Invoice footer"
          htmlFor="invoice_footer"
          hint="Short line printed at the very bottom of every invoice — e.g. a thank-you note"
        >
          <Input id="invoice_footer" name="invoice_footer" defaultValue={invoiceFooter} disabled={!canManage} />
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
