"use client";

import { useState } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function InviteUserModal({ onClose }: { onClose: () => void }) {
  const { roles, inviteUser } = useDemo();
  const { push } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleName, setRoleName] = useState(roles[0]?.name ?? "");

  return (
    <Modal open onClose={onClose} title="Invite user">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!fullName.trim() || !email.trim()) return;
          inviteUser(fullName.trim(), email.trim(), roleName);
          push("Invite sent");
          onClose();
        }}
      >
        <FormField label="Full name" htmlFor="fullName" required>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </FormField>
        <FormField label="Email" htmlFor="email" required>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Role" htmlFor="roleName">
          <Select id="roleName" value={roleName} onChange={(e) => setRoleName(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Send invite</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoUsersPage() {
  const { users } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Users" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Invite User
        </Button>
      </div>

      <Card>
        {users.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No users yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{u.fullName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{u.roleName}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={u.status === "active" ? "success" : "warning"}>{u.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <InviteUserModal onClose={() => setOpen(false)} />}
    </div>
  );
}
