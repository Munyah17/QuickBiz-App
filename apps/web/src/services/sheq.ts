import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface IncidentRow {
  id: string;
  incidentNumber: string;
  incidentType: string;
  severity: "minor" | "moderate" | "major" | "critical";
  title: string;
  description: string;
  location: string | null;
  dateOccurred: string;
  status: "open" | "under_investigation" | "closed" | "archived";
  rootCause: string | null;
  correctiveActions: string | null;
  preventiveActions: string | null;
  targetCompletionDate: string | null;
  actualCompletionDate: string | null;
}

export async function listSheqIncidents(supabase: SupabaseClient, orgId: string, status?: string): Promise<IncidentRow[]> {
  let query = supabase
    .from("sheq_incidents")
    .select(
      "id, incident_number, incident_type, severity, title, description, location, date_occurred, status, root_cause, corrective_actions, preventive_actions, target_completion_date, actual_completion_date"
    )
    .eq("org_id", orgId)
    .order("date_occurred", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      incident_number: string;
      incident_type: string;
      severity: IncidentRow["severity"];
      title: string;
      description: string;
      location: string | null;
      date_occurred: string;
      status: IncidentRow["status"];
      root_cause: string | null;
      corrective_actions: string | null;
      preventive_actions: string | null;
      target_completion_date: string | null;
      actual_completion_date: string | null;
    }>
  ).map((row) => ({
    id: row.id,
    incidentNumber: row.incident_number,
    incidentType: row.incident_type,
    severity: row.severity,
    title: row.title,
    description: row.description,
    location: row.location,
    dateOccurred: row.date_occurred,
    status: row.status,
    rootCause: row.root_cause,
    correctiveActions: row.corrective_actions,
    preventiveActions: row.preventive_actions,
    targetCompletionDate: row.target_completion_date,
    actualCompletionDate: row.actual_completion_date,
  }));
}

export interface CreateIncidentInput {
  incidentType: string;
  severity: string;
  title: string;
  description: string;
  dateOccurred: string;
  location: string;
}

export async function createSheqIncident(supabase: SupabaseClient, orgId: string, input: CreateIncidentInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_sheq_incident", {
    p_org_id: orgId,
    p_incident_type: input.incidentType,
    p_severity: input.severity,
    p_title: input.title,
    p_description: input.description,
    p_date_occurred: input.dateOccurred,
    p_location: input.location || null,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface RecordCorrectiveActionInput {
  rootCause: string;
  correctiveActions: string;
  preventiveActions: string;
  targetCompletionDate: string;
}

export async function recordCorrectiveAction(supabase: SupabaseClient, incidentId: string, input: RecordCorrectiveActionInput): Promise<void> {
  const { error } = await supabase
    .from("sheq_incidents")
    .update({
      root_cause: input.rootCause || null,
      corrective_actions: input.correctiveActions || null,
      preventive_actions: input.preventiveActions || null,
      target_completion_date: input.targetCompletionDate || null,
      status: "under_investigation",
    })
    .eq("id", incidentId);
  if (error) throw error;
}

export async function closeIncident(supabase: SupabaseClient, incidentId: string): Promise<void> {
  const { error } = await supabase
    .from("sheq_incidents")
    .update({ status: "closed", actual_completion_date: new Date().toISOString().slice(0, 10) })
    .eq("id", incidentId);
  if (error) throw error;
}

export interface InspectionRow {
  id: string;
  inspectionNumber: string;
  inspectionType: string;
  title: string;
  area: string | null;
  scheduledDate: string;
  completedDate: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "overdue";
  findings: string | null;
  nonConformities: number | null;
  minorIssues: number | null;
  majorIssues: number | null;
  criticalIssues: number | null;
  overallScore: number | null;
  followUpRequired: boolean;
}

export async function listSheqInspections(supabase: SupabaseClient, orgId: string, status?: string): Promise<InspectionRow[]> {
  let query = supabase
    .from("sheq_inspections")
    .select(
      "id, inspection_number, inspection_type, title, area, scheduled_date, completed_date, status, findings, non_conformities, minor_issues, major_issues, critical_issues, overall_score, follow_up_required"
    )
    .eq("org_id", orgId)
    .order("scheduled_date", { ascending: false });
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      inspection_number: string;
      inspection_type: string;
      title: string;
      area: string | null;
      scheduled_date: string;
      completed_date: string | null;
      status: InspectionRow["status"];
      findings: string | null;
      non_conformities: number | null;
      minor_issues: number | null;
      major_issues: number | null;
      critical_issues: number | null;
      overall_score: number | null;
      follow_up_required: boolean;
    }>
  ).map((row) => ({
    id: row.id,
    inspectionNumber: row.inspection_number,
    inspectionType: row.inspection_type,
    title: row.title,
    area: row.area,
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    status: row.status,
    findings: row.findings,
    nonConformities: row.non_conformities,
    minorIssues: row.minor_issues,
    majorIssues: row.major_issues,
    criticalIssues: row.critical_issues,
    overallScore: row.overall_score,
    followUpRequired: row.follow_up_required,
  }));
}

export interface CreateInspectionInput {
  inspectionType: string;
  title: string;
  scheduledDate: string;
  description: string;
}

export async function createSheqInspection(supabase: SupabaseClient, orgId: string, input: CreateInspectionInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_sheq_inspection", {
    p_org_id: orgId,
    p_inspection_type: input.inspectionType,
    p_title: input.title,
    p_scheduled_date: input.scheduledDate,
    p_description: input.description || null,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface CompleteInspectionInput {
  findings: string;
  nonConformities: number;
  minorIssues: number;
  majorIssues: number;
  criticalIssues: number;
  followUpRequired: boolean;
}

export async function completeInspection(supabase: SupabaseClient, inspectionId: string, input: CompleteInspectionInput): Promise<void> {
  const { error } = await supabase
    .from("sheq_inspections")
    .update({
      status: "completed",
      completed_date: new Date().toISOString().slice(0, 10),
      findings: input.findings || null,
      non_conformities: input.nonConformities,
      minor_issues: input.minorIssues,
      major_issues: input.majorIssues,
      critical_issues: input.criticalIssues,
      follow_up_required: input.followUpRequired,
    })
    .eq("id", inspectionId);
  if (error) throw error;
}
