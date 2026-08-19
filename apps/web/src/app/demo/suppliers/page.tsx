"use client";

import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const { addSupplier } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <Modal open onClose={onClose} title="Add supplier">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addSupplier({ name: name.trim(), email: email.trim(), phone: phone.trim() });
          push("Supplier added");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name" required>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add supplier</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoSuppliersPage() {
  const { suppliers } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Purchasing" title="Suppliers" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        {suppliers.length === 0 ? (
          <EmptyState icon={Truck} title="No suppliers yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Phone</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{s.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.email || "Not provided"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.phone || "Not provided"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddSupplierModal onClose={() => setOpen(false)} />}
    </div>
  );
}
