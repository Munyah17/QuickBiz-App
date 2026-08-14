"use client";

import { useState } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { InviteUserModal } from "./InviteUserModal";
import { RoleAssignSelect } from "./RoleAssignSelect";
import type { OrgMember } from "@/services/members";

export function UsersTable({
  members,
  roles,
  canManage,
}: {
  members: OrgMember[];
  roles: Array<{ id: string; key: string; name: string }>;
  canManage: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">{members.length} members</h3>
        {canManage && (
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Invite User
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No members yet" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Branch</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-text-primary">{member.fullName ?? "Pending"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{member.branchName ?? "No branch"}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={member.status === "active" ? "success" : "warning"}>{member.status}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  {canManage ? (
                    <RoleAssignSelect orgMemberId={member.id} currentRoleId={member.roleId ?? undefined} roles={roles} />
                  ) : (
                    <span className="text-text-secondary">{member.roleNames.join(", ") || "No role"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <InviteUserModal open={modalOpen} onClose={() => setModalOpen(false)} roles={roles} />
    </Card>
  );
}
