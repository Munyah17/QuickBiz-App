import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface ProjectListRow {
  id: string;
  name: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  budget: number;
  start_date: string | null;
  end_date: string | null;
  customerName: string | null;
}

export async function listProjects(supabase: SupabaseClient, orgId: string): Promise<ProjectListRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, budget, start_date, end_date, customers(name)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data as unknown as Array<Omit<ProjectListRow, "customerName"> & { customers: { name: string } | null }>).map((row) => ({
    ...row,
    customerName: row.customers?.name ?? null,
  }));
}

export interface ProjectInput {
  customerId: string;
  name: string;
  description: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
}

export async function createProject(supabase: SupabaseClient, orgId: string, input: ProjectInput): Promise<string> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      org_id: orgId,
      customer_id: input.customerId || null,
      name: input.name,
      description: input.description || null,
      status: input.status,
      budget: input.budget,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: ProjectListRow["status"];
  budget: number;
  start_date: string | null;
  end_date: string | null;
  customerName: string | null;
}

export async function getProject(supabase: SupabaseClient, orgId: string, projectId: string): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, status, budget, start_date, end_date, customers(name)")
    .eq("org_id", orgId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as Omit<ProjectDetail, "customerName"> & { customers: { name: string } | null };
  return { ...row, customerName: row.customers?.name ?? null };
}

export async function updateProjectStatus(supabase: SupabaseClient, projectId: string, status: string) {
  const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);
  if (error) throw error;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  due_date: string | null;
}

export async function listProjectTasks(supabase: SupabaseClient, projectId: string): Promise<ProjectTask[]> {
  const { data, error } = await supabase
    .from("project_tasks")
    .select("id, title, status, due_date")
    .eq("project_id", projectId)
    .order("created_at");
  if (error) throw error;
  return data as ProjectTask[];
}

export async function createProjectTask(
  supabase: SupabaseClient,
  orgId: string,
  projectId: string,
  input: { title: string; dueDate: string }
) {
  const { error } = await supabase
    .from("project_tasks")
    .insert({ org_id: orgId, project_id: projectId, title: input.title, due_date: input.dueDate || null });
  if (error) throw error;
}

export async function updateProjectTaskStatus(supabase: SupabaseClient, taskId: string, status: string) {
  const { error } = await supabase.from("project_tasks").update({ status }).eq("id", taskId);
  if (error) throw error;
}
