"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil, Contact as ContactIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { CustomerFormModal } from "./CustomerFormModal";
import { setCustomerActiveAction, initialCustomerActionState } from "./actions";
import type { Customer } from "@/services/customers";

function ActiveToggle({ customer }: { customer: Customer }) {
  const [state, formAction, isPending] = useActionState(setCustomerActiveAction, initialCustomerActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(customer.is_active ? "Customer deactivated" : "Customer reactivated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="customerId" value={customer.id} />
      <input type="hidden" name="isActive" value={String(!customer.is_active)} />
      <button
        type="submit"
        disabled={isPending}
        className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50"
      >
        {customer.is_active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

export function CustomersTable({ customers, canManage }: { customers: Customer[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | undefined>(undefined);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{customers.length} customers</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            New Customer
          </Button>
        )}
      </div>

      {customers.length === 0 ? (
        <EmptyState icon={ContactIcon} title="No customers yet" description="Add your first customer to get started." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{customer.name}</td>
                <td className="px-4 py-2.5 capitalize text-text-secondary">{customer.customer_type}</td>
                <td className="px-4 py-2.5 text-text-secondary">{customer.email || "No email"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{customer.phone || "No phone"}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {[customer.address?.city, customer.address?.country].filter(Boolean).join(", ") || "No address"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={customer.is_active ? "success" : "neutral"}>
                    {customer.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setEditing(customer);
                          setModalOpen(true);
                        }}
                        title="Edit customer"
                        className="text-text-tertiary hover:text-primary-600"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <ActiveToggle customer={customer} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canManage && modalOpen && (
        <CustomerFormModal key={editing?.id ?? "new"} open={modalOpen} onClose={() => setModalOpen(false)} customer={editing} />
      )}
    </Card>
  );
}
