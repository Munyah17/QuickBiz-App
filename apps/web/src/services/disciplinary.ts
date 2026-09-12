import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface DisciplinaryCaseRow {
  id: string;
  caseNumber: string;
  employeeName: string;
  violationType: string;
  severity: "minor" | "moderate" | "major" | "gross";
  title: string;
  incidentDate: string;
  status: "open" | "under_investigation" | "hearing_scheduled" | "hearing_completed" | "action_taken" | "appealed" | "closed";
}

export async function listDisciplinaryCases(supabase: SupabaseClient, orgId: string, status?: string): Promise<DisciplinaryCaseRow[]> {
  const { data, error } = await supabase.rpc("list_disciplinary_cases", {
    p_org_id: orgId,
    p_status: status ?? undefined,
  });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      case_number: string;
      employee_name: string;
      violation_type: string;
      severity: DisciplinaryCaseRow["severity"];
      title: string;
      incident_date: string;
      status: DisciplinaryCaseRow["status"];
    }>
  ).map((row) => ({
    id: row.id,
    caseNumber: row.case_number,
    employeeName: row.employee_name,
    violationType: row.violation_type,
    severity: row.severity,
    title: row.title,
    incidentDate: row.incident_date,
    status: row.status,
  }));
}

export interface CreateDisciplinaryCaseInput {
  employeeId: string;
  violationType: string;
  severity: string;
  title: string;
  description: string;
  incidentDate: string;
}

export async function createDisciplinaryCase(supabase: SupabaseClient, orgId: string, input: CreateDisciplinaryCaseInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_disciplinary_case", {
    p_org_id: orgId,
    p_employee_id: input.employeeId,
    p_violation_type: input.violationType,
    p_severity: input.severity,
    p_title: input.title,
    p_description: input.description,
    p_incident_date: input.incidentDate,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface RecordCaseActionInput {
  actionType: string;
  actionTaken: string;
  actionEffectiveDate: string;
}

export async function recordCaseAction(supabase: SupabaseClient, caseId: string, input: RecordCaseActionInput): Promise<void> {
  const { error } = await supabase
    .from("disciplinary_cases")
    .update({
      action_type: input.actionType,
      action_taken: input.actionTaken,
      action_effective_date: input.actionEffectiveDate || null,
      status: "action_taken",
    })
    .eq("id", caseId);
  if (error) throw error;
}

export async function closeDisciplinaryCase(supabase: SupabaseClient, caseId: string): Promise<void> {
  const { error } = await supabase.from("disciplinary_cases").update({ status: "closed" }).eq("id", caseId);
  if (error) throw error;
}

export interface DisciplinaryHearingRow {
  id: string;
  caseId: string;
  caseNumber: string;
  hearingDate: string;
  hearingTime: string | null;
  location: string | null;
  status: "scheduled" | "in_progress" | "completed" | "postponed" | "cancelled";
  outcome: string | null;
  decision: string | null;
}

export async function listDisciplinaryHearings(supabase: SupabaseClient, orgId: string): Promise<DisciplinaryHearingRow[]> {
  const { data, error } = await supabase
    .from("disciplinary_hearings")
    .select("id, case_id, hearing_date, hearing_time, location, status, outcome, decision, disciplinary_cases(case_number)")
    .eq("org_id", orgId)
    .order("hearing_date", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      case_id: string;
      hearing_date: string;
      hearing_time: string | null;
      location: string | null;
      status: DisciplinaryHearingRow["status"];
      outcome: string | null;
      decision: string | null;
      disciplinary_cases: { case_number: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    caseId: row.case_id,
    caseNumber: row.disciplinary_cases?.case_number ?? "Unknown case",
    hearingDate: row.hearing_date,
    hearingTime: row.hearing_time,
    location: row.location,
    status: row.status,
    outcome: row.outcome,
    decision: row.decision,
  }));
}

export interface ScheduleHearingInput {
  caseId: string;
  hearingDate: string;
  hearingTime: string;
  location: string;
}

export async function scheduleDisciplinaryHearing(supabase: SupabaseClient, input: ScheduleHearingInput): Promise<string> {
  const { data, error } = await supabase.rpc("schedule_disciplinary_hearing", {
    p_case_id: input.caseId,
    p_hearing_date: input.hearingDate,
    p_hearing_time: input.hearingTime || undefined,
    p_location: input.location || undefined,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface RecordHearingOutcomeInput {
  outcome: string;
  decision: string;
}

export async function recordHearingOutcome(supabase: SupabaseClient, hearingId: string, input: RecordHearingOutcomeInput): Promise<void> {
  const { error } = await supabase
    .from("disciplinary_hearings")
    .update({
      outcome: input.outcome || null,
      decision: input.decision || null,
      decision_date: new Date().toISOString().slice(0, 10),
      status: "completed",
    })
    .eq("id", hearingId);
  if (error) throw error;
}

export interface DisciplinaryWarningRow {
  id: string;
  employeeName: string;
  warningType: "verbal" | "written" | "final";
  reason: string;
  issuedDate: string;
  expiresDate: string | null;
  acknowledged: boolean;
}

export async function listDisciplinaryWarnings(supabase: SupabaseClient, orgId: string): Promise<DisciplinaryWarningRow[]> {
  const { data, error } = await supabase
    .from("disciplinary_warnings")
    .select("id, warning_type, reason, issued_date, expires_date, acknowledged, employees(full_name)")
    .eq("org_id", orgId)
    .order("issued_date", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      warning_type: DisciplinaryWarningRow["warningType"];
      reason: string;
      issued_date: string;
      expires_date: string | null;
      acknowledged: boolean;
      employees: { full_name: string } | null;
    }>
  ).map((row) => ({
    id: row.id,
    employeeName: row.employees?.full_name ?? "Unknown employee",
    warningType: row.warning_type,
    reason: row.reason,
    issuedDate: row.issued_date,
    expiresDate: row.expires_date,
    acknowledged: row.acknowledged,
  }));
}

export interface IssueWarningInput {
  employeeId: string;
  warningType: string;
  reason: string;
  caseId?: string;
  expiresDate?: string;
}

export async function issueDisciplinaryWarning(supabase: SupabaseClient, orgId: string, input: IssueWarningInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_disciplinary_warning", {
    p_org_id: orgId,
    p_employee_id: input.employeeId,
    p_warning_type: input.warningType,
    p_reason: input.reason,
    p_case_id: input.caseId || undefined,
    p_expires_date: input.expiresDate || undefined,
  });
  if (error) throw error;

  return data as unknown as string;
}
