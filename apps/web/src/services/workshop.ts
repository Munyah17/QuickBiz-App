import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface WorkshopJobRow {
  id: string;
  job_number: string;
  product_name: string | null;
  description: string | null;
  status: "scheduled" | "in_progress" | "on_hold" | "completed";
  scheduled_start: string | null;
  scheduled_end: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  technicianName: string | null;
  workOrderNumber: string | null;
}

export async function listWorkshopJobs(supabase: SupabaseClient, orgId: string): Promise<WorkshopJobRow[]> {
  const { data, error } = await supabase
    .from("workshop_jobs")
    .select("id, job_number, product_name, description, status, scheduled_start, scheduled_end, completed_at, notes, created_at, employees(full_name), work_orders(wo_number)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (
    (data ?? []) as unknown as Array<
      Omit<WorkshopJobRow, "technicianName" | "workOrderNumber"> & {
        employees: { full_name: string } | null;
        work_orders: { wo_number: string } | null;
      }
    >
  ).map((r) => ({
    ...r,
    technicianName: r.employees?.full_name ?? null,
    workOrderNumber: r.work_orders?.wo_number ?? null,
  }));
}

export interface WorkshopJobInput {
  workOrderId: string;
  productName: string;
  description: string;
  technicianId: string;
  scheduledStart: string;
  scheduledEnd: string;
  notes: string;
}

export async function createWorkshopJob(supabase: SupabaseClient, orgId: string, input: WorkshopJobInput) {
  const { data: jobNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "workshop_job",
  });
  if (numError) throw numError;

  const { error } = await supabase.from("workshop_jobs").insert({
    org_id: orgId,
    job_number: jobNumber,
    work_order_id: input.workOrderId || null,
    product_name: input.productName || null,
    description: input.description || null,
    technician_id: input.technicianId || null,
    scheduled_start: input.scheduledStart || null,
    scheduled_end: input.scheduledEnd || null,
    notes: input.notes || null,
    status: "scheduled",
  });
  if (error) throw error;
}

export async function setWorkshopJobStatus(supabase: SupabaseClient, jobId: string, status: string) {
  const { error } = await supabase
    .from("workshop_jobs")
    .update({
      status,
      completed_at: status === "completed" ? new Date().toISOString() : undefined,
    })
    .eq("id", jobId);
  if (error) throw error;
}
