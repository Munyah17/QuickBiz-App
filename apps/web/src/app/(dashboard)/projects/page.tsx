import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listProjects } from "@/services/projects";
import { listCustomers } from "@/services/customers";
import { NewProjectModal } from "./NewProjectModal";
import { ProjectsTable } from "./ProjectsTable";

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

      <ProjectsTable projects={projects} canManage={canManage} />
    </div>
  );
}
