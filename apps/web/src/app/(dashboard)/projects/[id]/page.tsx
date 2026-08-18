import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getProject, listProjectTasks } from "@/services/projects";
import { ProjectStatusSelect } from "./ProjectStatusSelect";
import { TaskList } from "./TaskList";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");

  const project = await getProject(supabase, orgId, id);
  if (!project) notFound();

  const tasks = await listProjectTasks(supabase, id);
  const canManage = permissions.has("projects.manage");
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        module="Projects"
        title={project.name}
        action={canManage ? <ProjectStatusSelect projectId={project.id} status={project.status} /> : undefined}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title={`Tasks (${doneCount}/${tasks.length} done)`} />
            <TaskList tasks={tasks} projectId={project.id} canManage={canManage} />
          </Card>
        </div>

        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Customer</span>
            <span className="text-sm text-text-primary">{project.customerName ?? "Internal"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Budget</span>
            <span className="text-sm font-semibold text-text-primary">${project.budget.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">Start date</span>
            <span className="text-sm text-text-primary">{project.start_date ? new Date(project.start_date).toLocaleDateString() : "Not set"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">End date</span>
            <span className="text-sm text-text-primary">{project.end_date ? new Date(project.end_date).toLocaleDateString() : "Not set"}</span>
          </div>
          {project.description && (
            <div className="border-t border-border-subtle pt-3">
              <p className="text-sm font-medium text-text-secondary">Description</p>
              <p className="text-sm text-text-primary">{project.description}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
