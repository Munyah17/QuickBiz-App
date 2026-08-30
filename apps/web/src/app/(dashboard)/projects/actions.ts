"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import {
  createProject,
  updateProjectStatus,
  createProjectTask,
  updateProjectTaskStatus,
  type ProjectInput,
} from "@/services/projects";

export interface ProjectActionState {
  error: string | null;
  success: boolean;
}

export const initialProjectActionState: ProjectActionState = { error: null, success: false };

export async function createProjectAction(_prev: ProjectActionState, formData: FormData): Promise<ProjectActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "projects");

  if (!permissions.has("projects.manage")) {
    return { error: "You don't have permission to create projects.", success: false };
  }

  const input: ProjectInput = {
    customerId: String(formData.get("customerId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? "planning"),
    budget: Number(formData.get("budget") ?? 0),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
  };

  if (!input.name) return { error: "Project name is required.", success: false };

  let projectId: string;
  try {
    projectId = await createProject(supabase, orgId, input);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/projects");
  redirect(`/projects/${projectId}`);
}

export async function updateProjectStatusAction(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("projects.manage")) {
    return { error: "You don't have permission to update this project.", success: false };
  }

  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateProjectStatus(supabase, projectId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, success: true };
}

export async function bulkSetProjectStatusAction(projectIds: string[], status: string): Promise<ProjectActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("projects.manage")) {
    return { error: "You don't have permission to update projects.", success: false };
  }
  if (projectIds.length === 0) return { error: "No projects selected.", success: false };

  try {
    await Promise.all(projectIds.map((id) => updateProjectStatus(supabase, id, status)));
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/projects");
  return { error: null, success: true };
}

export async function createProjectTaskAction(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("projects.manage")) {
    return { error: "You don't have permission to add tasks.", success: false };
  }

  const projectId = String(formData.get("projectId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");

  if (!title) return { error: "Task title is required.", success: false };

  try {
    await createProjectTask(supabase, orgId, projectId, { title, dueDate });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, success: true };
}

export async function updateProjectTaskStatusAction(
  _prev: ProjectActionState,
  formData: FormData
): Promise<ProjectActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("projects.manage")) {
    return { error: "You don't have permission to update tasks.", success: false };
  }

  const taskId = String(formData.get("taskId") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  const status = String(formData.get("status") ?? "");

  try {
    await updateProjectTaskStatus(supabase, taskId, status);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath(`/projects/${projectId}`);
  return { error: null, success: true };
}
