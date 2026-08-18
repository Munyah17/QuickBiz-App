import Link from "next/link";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listProjects } from "@/services/projects";
import { listCustomers } from "@/services/customers";
import { NewProjectModal } from "./NewProjectModal";

const statusTone: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  planning: "neutral",
  active: "info",
  on_hold: "warning",
  completed: "success",
  cancelled: "danger",
};

export default async function ProjectsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");
  const canManage = permissions.has("projects.manage");

  const [projects, customers] = await Promise.all([listProjects(supabase, orgId), listCustomers(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Projects" />
        {canManage && <NewProjectModal customers={customers.filter((c) => c.is_active)} />}
      </div>

      <Card>
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="No projects yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Budget</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Dates</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/projects/${p.id}`} className="font-medium text-primary-600 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.customerName ?? "Internal"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">${p.budget.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={statusTone[p.status] ?? "neutral"}>{p.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {p.start_date ? new Date(p.start_date).toLocaleDateString() : "No start date"}
                    {p.end_date ? ` to ${new Date(p.end_date).toLocaleDateString()}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
