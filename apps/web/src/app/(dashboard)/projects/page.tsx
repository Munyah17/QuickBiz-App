import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardHeader } from "@/components/Card";
import { BreakdownBarChart } from "@/components/BreakdownBarChart";
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

  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);

  const statusBreakdown = projects.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusSegments = Object.entries(statusBreakdown).map(([label, value]) => ({ label, value }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Projects" />
        {canManage && <NewProjectModal customers={customers.filter((c) => c.is_active)} />}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={totalProjects.toString()}
          tone="primary"
        />
        <StatCard
          label="Active"
          value={activeProjects.toString()}
          tone="success"
        />
        <StatCard
          label="Completed"
          value={completedProjects.toString()}
          tone="info"
        />
        <StatCard
          label="Total Budget"
          value={`$${totalBudget.toLocaleString()}`}
          tone="warning"
        />
      </div>

      {statusSegments.length > 0 && (
        <Card>
          <CardHeader title="Projects by status" />
          <div className="p-4">
            <BreakdownBarChart segments={statusSegments} />
          </div>
        </Card>
      )}

      <ProjectsTable projects={projects} canManage={canManage} />
    </div>
  );
}
