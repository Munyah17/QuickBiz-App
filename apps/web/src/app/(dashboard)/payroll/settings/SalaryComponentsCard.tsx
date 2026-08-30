"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Coins } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import {
  createSalaryComponentAction,
  setSalaryComponentActiveAction,
  initialPayrollSettingsActionState,
} from "./actions";
import type { SalaryComponent } from "@/services/payroll";

function ActiveToggle({ component }: { component: SalaryComponent }) {
  const [state, formAction, isPending] = useActionState(setSalaryComponentActiveAction, initialPayrollSettingsActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="componentId" value={component.id} />
      <input type="hidden" name="isActive" value={String(!component.is_active)} />
      <button type="submit" disabled={isPending} className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50">
        {component.is_active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

function NewComponentForm() {
  const [state, formAction, isPending] = useActionState(createSalaryComponentAction, initialPayrollSettingsActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Component created");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 border-t border-border-subtle p-4 sm:grid-cols-4 sm:items-end">
      <FormField label="Name" htmlFor="name" required>
        <Input id="name" name="name" required placeholder="e.g. Housing Allowance" />
      </FormField>
      <FormField label="Type" htmlFor="componentType">
        <Select id="componentType" name="componentType" defaultValue="earning">
          <option value="earning">Earning</option>
          <option value="deduction">Deduction</option>
        </Select>
      </FormField>
      <FormField label="Calculation" htmlFor="calculationMethod">
        <Select id="calculationMethod" name="calculationMethod" defaultValue="fixed">
          <option value="fixed">Fixed amount</option>
          <option value="percent_of_basic">% of basic</option>
        </Select>
      </FormField>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <FormField label="Default amount" htmlFor="defaultAmount">
            <Input id="defaultAmount" name="defaultAmount" type="number" min="0" step="0.01" defaultValue={0} />
          </FormField>
        </div>
        <Button type="submit" loading={isPending}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>
    </form>
  );
}

export function SalaryComponentsCard({ components }: { components: SalaryComponent[] }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Salary components"
        action={
          <Button size="sm" variant="secondary" onClick={() => setShowForm((s) => !s)}>
            <Plus className="size-4" />
            New Component
          </Button>
        }
      />

      {components.length === 0 ? (
        <EmptyState icon={Coins} title="No salary components yet" description="Add allowances and recurring deductions employees can be assigned." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Calculation</th>
              <th className="px-4 py-2.5">Default</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {components.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{c.name}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={c.component_type === "earning" ? "success" : "warning"}>{c.component_type}</Badge>
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {c.calculation_method === "percent_of_basic" ? "% of basic" : "Fixed amount"}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {c.calculation_method === "percent_of_basic" ? `${c.default_amount}%` : `$${c.default_amount.toFixed(2)}`}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <ActiveToggle component={c} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && <NewComponentForm />}
    </Card>
  );
}
