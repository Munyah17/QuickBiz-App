"use client";

import { useState } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { InviteStaffModal } from "./InviteStaffModal";
import { StaffStatusButton } from "./StaffStatusButton";
import type { PlatformStaffRow } from "@/services/platform";

export function StaffTable({
  staff,
  roles,
}: {
  staff: PlatformStaffRow[];
  roles: Array<{ key: string; name: string }>;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{staff.length} staff members</h3>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="size-4" />
          Invite Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No staff yet" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{member.fullName ?? "Pending"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{member.email ?? "Unknown"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{member.roleName}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={member.status === "active" ? "success" : "warning"}>{member.status}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <StaffStatusButton staffId={member.id} currentStatus={member.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <InviteStaffModal open={modalOpen} onClose={() => setModalOpen(false)} roles={roles} />
    </Card>
  );
}
