"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Pencil, Truck } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useToast } from "@/components/Toast";
import { SupplierFormModal } from "./SupplierFormModal";
import { setSupplierActiveAction, initialSupplierActionState } from "./actions";
import type { Supplier } from "@/services/purchasing";

function ActiveToggle({ supplier }: { supplier: Supplier }) {
  const [state, formAction, isPending] = useActionState(setSupplierActiveAction, initialSupplierActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push(supplier.is_active ? "Supplier deactivated" : "Supplier reactivated");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction}>
      <input type="hidden" name="supplierId" value={supplier.id} />
      <input type="hidden" name="isActive" value={String(!supplier.is_active)} />
      <button type="submit" disabled={isPending} className="text-sm font-medium text-primary-600 hover:underline disabled:opacity-50">
        {supplier.is_active ? "Deactivate" : "Reactivate"}
      </button>
    </form>
  );
}

export function SuppliersTable({ suppliers, canManage }: { suppliers: Supplier[]; canManage: boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | undefined>(undefined);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{suppliers.length} suppliers</h3>
        {canManage && (
          <Button
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            New Supplier
          </Button>
        )}
      </div>

      {suppliers.length === 0 ? (
        <EmptyState icon={Truck} title="No suppliers yet" description="Add your first supplier to start purchasing." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Phone</th>
              <th className="px-4 py-2.5">Location</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{supplier.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{supplier.email || "No email"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{supplier.phone || "No phone"}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {[supplier.address?.city, supplier.address?.country].filter(Boolean).join(", ") || "No address"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={supplier.is_active ? "success" : "neutral"}>{supplier.is_active ? "Active" : "Inactive"}</Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setEditing(supplier);
                          setModalOpen(true);
                        }}
                        title="Edit supplier"
                        className="text-text-tertiary hover:text-primary-600"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <ActiveToggle supplier={supplier} />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {canManage && modalOpen && (
        <SupplierFormModal key={editing?.id ?? "new"} open={modalOpen} onClose={() => setModalOpen(false)} supplier={editing} />
      )}
    </Card>
  );
}
