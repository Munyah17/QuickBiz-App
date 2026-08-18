import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface Department {
  id: string;
  name: string;
}

export async function listDepartments(supabase: SupabaseClient, orgId: string): Promise<Department[]> {
  const { data, error } = await supabase.from("departments").select("id, name").eq("org_id", orgId).order("name");
  if (error) throw error;
  return data as Department[];
}

export interface Employee {
  id: string;
  employee_number: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  hire_date: string | null;
  employment_status: "active" | "on_leave" | "terminated";
  branchId: string | null;
  branchName: string | null;
  departmentId: string | null;
  departmentName: string | null;
}

export async function listEmployees(supabase: SupabaseClient, orgId: string): Promise<Employee[]> {
  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, employee_number, full_name, email, phone, position, hire_date, employment_status, branch_id, department_id, branches(name), departments(name)"
    )
    .eq("org_id", orgId)
    .order("full_name");
  if (error) throw error;

  return (
    data as unknown as Array<
      Omit<Employee, "branchId" | "branchName" | "departmentId" | "departmentName"> & {
        branch_id: string | null;
        department_id: string | null;
        branches: { name: string } | null;
        departments: { name: string } | null;
      }
    >
  ).map((row) => ({
    ...row,
    branchId: row.branch_id,
    branchName: row.branches?.name ?? null,
    departmentId: row.department_id,
    departmentName: row.departments?.name ?? null,
  }));
}

export interface EmployeeInput {
  branchId: string;
  departmentId: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  hireDate: string;
  employmentStatus: string;
}

export async function createEmployee(supabase: SupabaseClient, orgId: string, input: EmployeeInput) {
  const { data: employeeNumber, error: numError } = await supabase.rpc("next_number", {
    target_org_id: orgId,
    p_entity_type: "employee",
  });
  if (numError) throw numError;

  const { error } = await supabase.from("employees").insert({
    org_id: orgId,
    branch_id: input.branchId || null,
    department_id: input.departmentId || null,
    employee_number: employeeNumber,
    full_name: input.fullName,
    email: input.email || null,
    phone: input.phone || null,
    position: input.position || null,
    hire_date: input.hireDate || null,
    employment_status: input.employmentStatus,
  });
  if (error) throw error;
}

export async function updateEmployee(supabase: SupabaseClient, employeeId: string, input: EmployeeInput) {
  const { error } = await supabase
    .from("employees")
    .update({
      branch_id: input.branchId || null,
      department_id: input.departmentId || null,
      full_name: input.fullName,
      email: input.email || null,
      phone: input.phone || null,
      position: input.position || null,
      hire_date: input.hireDate || null,
      employment_status: input.employmentStatus,
    })
    .eq("id", employeeId);
  if (error) throw error;
}
