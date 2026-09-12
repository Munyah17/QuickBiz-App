import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface InsurerRow {
  id: string;
  name: string;
  code: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
}

export async function listInsurers(supabase: SupabaseClient, orgId: string): Promise<InsurerRow[]> {
  const { data, error } = await supabase
    .from("insurers")
    .select("id, name, code, contact_person, email, phone, is_active")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      name: string;
      code: string;
      contact_person: string | null;
      email: string | null;
      phone: string | null;
      is_active: boolean;
    }>
  ).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    isActive: row.is_active,
  }));
}

export interface CreateInsurerInput {
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

export async function createInsurer(supabase: SupabaseClient, orgId: string, input: CreateInsurerInput): Promise<string> {
  const { data, error } = await supabase.rpc("add_insurer", {
    p_org_id: orgId,
    p_name: input.name,
    p_code: input.code,
    p_contact_person: input.contactPerson || null,
    p_email: input.email || null,
    p_phone: input.phone || null,
    p_address: input.address || null,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface PolicyRow {
  id: string;
  policyNumber: string;
  policyType: string;
  insurerName: string;
  sumInsured: number | null;
  premium: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "cancelled" | "pending_renewal";
}

export async function listInsurancePolicies(supabase: SupabaseClient, orgId: string): Promise<PolicyRow[]> {
  const { data, error } = await supabase.rpc("list_insurance_policies", { p_org_id: orgId });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      policy_number: string;
      policy_type: string;
      insurer_name: string | null;
      sum_insured: number | null;
      premium: number;
      start_date: string;
      end_date: string;
      status: PolicyRow["status"];
    }>
  ).map((row) => ({
    id: row.id,
    policyNumber: row.policy_number,
    policyType: row.policy_type,
    insurerName: row.insurer_name ?? "Unknown insurer",
    sumInsured: row.sum_insured,
    premium: row.premium,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  }));
}

export interface CreatePolicyInput {
  insurerId: string;
  policyNumber: string;
  policyType: string;
  coverageType: string;
  sumInsured: number;
  premium: number;
  startDate: string;
  endDate: string;
  assetId: string;
  vehicleId: string;
}

export async function createInsurancePolicy(supabase: SupabaseClient, orgId: string, input: CreatePolicyInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_insurance_policy", {
    p_org_id: orgId,
    p_insurer_id: input.insurerId,
    p_policy_number: input.policyNumber,
    p_policy_type: input.policyType,
    p_sum_insured: input.sumInsured || null,
    p_premium: input.premium,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_asset_id: input.assetId || null,
    p_vehicle_id: input.vehicleId || null,
    p_coverage_type: input.coverageType || null,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface ClaimRow {
  id: string;
  policyId: string;
  claimNumber: string;
  incidentDate: string;
  incidentDescription: string;
  claimAmount: number;
  currency: string;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "paid" | "closed";
  submittedAt: string;
}

export async function listPolicyClaims(supabase: SupabaseClient, policyId: string): Promise<ClaimRow[]> {
  const { data, error } = await supabase
    .from("insurance_claims")
    .select("id, policy_id, claim_number, incident_date, incident_description, claim_amount, currency, status, submitted_at")
    .eq("policy_id", policyId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      policy_id: string;
      claim_number: string;
      incident_date: string;
      incident_description: string;
      claim_amount: number;
      currency: string;
      status: ClaimRow["status"];
      submitted_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    policyId: row.policy_id,
    claimNumber: row.claim_number,
    incidentDate: row.incident_date,
    incidentDescription: row.incident_description,
    claimAmount: row.claim_amount,
    currency: row.currency,
    status: row.status,
    submittedAt: row.submitted_at,
  }));
}

export async function submitInsuranceClaim(
  supabase: SupabaseClient,
  policyId: string,
  incidentDate: string,
  incidentDescription: string,
  claimAmount: number
): Promise<string> {
  const { data, error } = await supabase.rpc("submit_insurance_claim", {
    p_policy_id: policyId,
    p_incident_date: incidentDate,
    p_incident_description: incidentDescription,
    p_claim_amount: claimAmount,
  });
  if (error) throw error;

  return data as unknown as string;
}

export interface RiskAssessmentRow {
  id: string;
  title: string;
  category: string | null;
  riskLevel: "low" | "medium" | "high" | "critical";
  likelihood: number | null;
  impact: number | null;
  riskScore: number | null;
  description: string | null;
  mitigationStrategy: string | null;
  reviewDate: string | null;
  status: "open" | "mitigating" | "mitigated" | "accepted" | "closed";
}

export async function listRiskAssessments(supabase: SupabaseClient, orgId: string): Promise<RiskAssessmentRow[]> {
  const { data, error } = await supabase
    .from("risk_assessments")
    .select(
      "id, title, category, risk_level, likelihood, impact, risk_score, description, mitigation_strategy, review_date, status"
    )
    .eq("org_id", orgId)
    .order("risk_score", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      title: string;
      category: string | null;
      risk_level: RiskAssessmentRow["riskLevel"];
      likelihood: number | null;
      impact: number | null;
      risk_score: number | null;
      description: string | null;
      mitigation_strategy: string | null;
      review_date: string | null;
      status: RiskAssessmentRow["status"];
    }>
  ).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    riskLevel: row.risk_level,
    likelihood: row.likelihood,
    impact: row.impact,
    riskScore: row.risk_score,
    description: row.description,
    mitigationStrategy: row.mitigation_strategy,
    reviewDate: row.review_date,
    status: row.status,
  }));
}

export interface CreateRiskAssessmentInput {
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  description: string;
  mitigationStrategy: string;
  reviewDate: string;
}

export async function createRiskAssessment(
  supabase: SupabaseClient,
  orgId: string,
  input: CreateRiskAssessmentInput
): Promise<string> {
  const { data, error } = await supabase.rpc("create_risk_assessment", {
    p_org_id: orgId,
    p_title: input.title,
    p_category: input.category || null,
    p_likelihood: input.likelihood,
    p_impact: input.impact,
    p_description: input.description || null,
    p_mitigation_strategy: input.mitigationStrategy || null,
    p_review_date: input.reviewDate || null,
  });
  if (error) throw error;

  return data as unknown as string;
}
