"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Pencil, Contact as ContactIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { CustomerFormModal } from "./CustomerFormModal";
import { setCustomerActiveAction, bulkSetCustomerActiveAction, initialCustomerActionState } from "./actions";
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
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (statusFilter === "active" && !c.is_active) return false;
      if (statusFilter === "inactive" && c.is_active) return false;
      if (!q) return true;
      return [c.name, c.email, c.phone, c.tax_number].some((field) => field?.toLowerCase().includes(q));
    });
  }, [customers, query, statusFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((c) => c.id)));
  }

  function runBulk(isActive: boolean) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetCustomerActiveAction(ids, isActive);
      if (result.success) {
        push(`${ids.length} customer${ids.length === 1 ? "" : "s"} ${isActive ? "reactivated" : "deactivated"}`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {customers.length} customers
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, email, phone..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
          <ExportButton
            filename="customers"
            rows={filtered.map((c) => ({
              Name: c.name,
              Type: c.customer_type,
              Email: c.email ?? "",
              Phone: c.phone ?? "",
              "Tax number": c.tax_number ?? "",
              City: c.address?.city ?? "",
              Country: c.address?.country ?? "",
              Status: c.is_active ? "Active" : "Inactive",
            }))}
          />
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
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk(false)}>
            Deactivate
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk(true)}>
            Reactivate
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {customers.length === 0 ? (
        <EmptyState icon={ContactIcon} title="No customers yet" description="Add your first customer to get started." />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ContactIcon} title="No customers match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
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
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(customer.id)}
                      onChange={() => toggleOne(customer.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
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
