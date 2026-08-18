"use client";

import { useState } from "react";
import { Plus, Contact } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddCustomerModal({ onClose }: { onClose: () => void }) {
  const { addCustomer } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <Modal open onClose={onClose} title="Add customer">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          addCustomer({ name: name.trim(), email: email.trim(), phone: phone.trim() });
          push("Customer added");
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
          <Button type="submit">Add customer</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoCustomersPage() {
  const { customers } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Customers" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        {customers.length === 0 ? (
          <EmptyState icon={Contact} title="No customers yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{c.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.email || "Not provided"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{c.phone || "Not provided"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={c.isActive ? "success" : "neutral"}>{c.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddCustomerModal onClose={() => setOpen(false)} />}
    </div>
  );
}
