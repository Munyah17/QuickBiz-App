import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

// ---------------------------------------------------------------------------
// Salary components (recurring earnings/deductions catalog)
// ---------------------------------------------------------------------------

export interface SalaryComponent {
  id: string;
  name: string;
  component_type: "earning" | "deduction";
  calculation_method: "fixed" | "percent_of_basic";
  default_amount: number;
  is_active: boolean;
}

export async function listSalaryComponents(supabase: SupabaseClient, orgId: string): Promise<SalaryComponent[]> {
  const { data, error } = await supabase
    .from("salary_components")
    .select("id, name, component_type, calculation_method, default_amount, is_active")
    .eq("org_id", orgId)
    .order("name");
  if (error) throw error;
  return data as SalaryComponent[];
}

export interface SalaryComponentInput {
  name: string;
  componentType: "earning" | "deduction";
  calculationMethod: "fixed" | "percent_of_basic";
  defaultAmount: number;
}

export async function createSalaryComponent(supabase: SupabaseClient, orgId: string, input: SalaryComponentInput) {
  const { error } = await supabase.from("salary_components").insert({
    org_id: orgId,
    name: input.name,
    component_type: input.componentType,
    calculation_method: input.calculationMethod,
    default_amount: input.defaultAmount,
  });
  if (error) throw error;
}

export async function setSalaryComponentActive(supabase: SupabaseClient, componentId: string, isActive: boolean) {
  const { error } = await supabase.from("salary_components").update({ is_active: isActive }).eq("id", componentId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Per-employee salary structure
// ---------------------------------------------------------------------------

export interface EmployeeCompensationRow {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  employmentStatus: "active" | "on_leave" | "terminated";
  basicSalary: number;
}

// Basic salary lives in employee_compensation (payroll.manage-gated), not on
// the openly-readable employees table - see 000039_payroll.sql. Joined here
// via the FK PostgREST recognizes between the two tables.
export async function listEmployeesWithCompensation(supabase: SupabaseClient, orgId: string): Promise<EmployeeCompensationRow[]> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, full_name, employee_number, employment_status, employee_compensation(basic_salary)")
    .eq("org_id", orgId)
    .order("full_name");
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      full_name: string;
      employee_number: string;
      employment_status: "active" | "on_leave" | "terminated";
      employee_compensation: { basic_salary: number } | { basic_salary: number }[] | null;
    }>
  ).map((row) => {
    const comp = Array.isArray(row.employee_compensation) ? row.employee_compensation[0] : row.employee_compensation;
    return {
      employeeId: row.id,
      employeeName: row.full_name,
      employeeNumber: row.employee_number,
      employmentStatus: row.employment_status,
      basicSalary: comp?.basic_salary ?? 0,
    };
  });
}

export interface EmployeeSalaryLine {
  id: string;
  componentId: string;
  componentName: string;
  componentType: "earning" | "deduction";
  calculationMethod: "fixed" | "percent_of_basic";
  amount: number;
  isActive: boolean;
}

export async function listEmployeeSalaryComponents(
  supabase: SupabaseClient,
  employeeId: string
): Promise<EmployeeSalaryLine[]> {
  const { data, error } = await supabase
    .from("employee_salary_components")
    .select("id, component_id, amount, is_active, salary_components(name, component_type, calculation_method)")
    .eq("employee_id", employeeId);
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      component_id: string;
      amount: number;
      is_active: boolean;
      salary_components: { name: string; component_type: "earning" | "deduction"; calculation_method: "fixed" | "percent_of_basic" } | null;
    }>
  ).map((row) => ({
    id: row.id,
    componentId: row.component_id,
    componentName: row.salary_components?.name ?? "Unknown component",
    componentType: row.salary_components?.component_type ?? "deduction",
    calculationMethod: row.salary_components?.calculation_method ?? "fixed",
    amount: row.amount,
    isActive: row.is_active,
  }));
}

/** All active employees' salary component assignments in one query, keyed by employee_id - for pages that render every employee's structure at once. */
export async function listAllEmployeeSalaryComponents(
  supabase: SupabaseClient,
  orgId: string
): Promise<Map<string, EmployeeSalaryLine[]>> {
  const { data, error } = await supabase
    .from("employee_salary_components")
    .select("id, employee_id, component_id, amount, is_active, salary_components(name, component_type, calculation_method)")
    .eq("org_id", orgId);
  if (error) throw error;

  const byEmployee = new Map<string, EmployeeSalaryLine[]>();
  for (const row of data as unknown as Array<{
    id: string;
    employee_id: string;
    component_id: string;
    amount: number;
    is_active: boolean;
    salary_components: { name: string; component_type: "earning" | "deduction"; calculation_method: "fixed" | "percent_of_basic" } | null;
  }>) {
    const list = byEmployee.get(row.employee_id) ?? [];
    list.push({
      id: row.id,
      componentId: row.component_id,
      componentName: row.salary_components?.name ?? "Unknown component",
      componentType: row.salary_components?.component_type ?? "deduction",
      calculationMethod: row.salary_components?.calculation_method ?? "fixed",
      amount: row.amount,
      isActive: row.is_active,
    });
    byEmployee.set(row.employee_id, list);
  }
  return byEmployee;
}

export async function setEmployeeBasicSalary(supabase: SupabaseClient, orgId: string, employeeId: string, basicSalary: number) {
  const { error } = await supabase
    .from("employee_compensation")
    .upsert({ org_id: orgId, employee_id: employeeId, basic_salary: basicSalary }, { onConflict: "employee_id" });
  if (error) throw error;
}

export async function assignEmployeeSalaryComponent(
  supabase: SupabaseClient,
  orgId: string,
  employeeId: string,
  componentId: string,
  amount: number
) {
  const { error } = await supabase.from("employee_salary_components").upsert(
    { org_id: orgId, employee_id: employeeId, component_id: componentId, amount, is_active: true },
    { onConflict: "employee_id,component_id" }
  );
  if (error) throw error;
}

export async function removeEmployeeSalaryComponent(supabase: SupabaseClient, assignmentId: string) {
  const { error } = await supabase.from("employee_salary_components").delete().eq("id", assignmentId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Statutory tax settings (org-editable, no invented defaults - see 000039)
// ---------------------------------------------------------------------------

export interface PayeBand {
  /** Upper bound of this bracket's gross pay, or null for the top (uncapped) bracket. */
  upTo: number | null;
  /** Percentage rate for this bracket, e.g. 20 = 20%. */
  rate: number;
  /** Flat "quick deduction" amount subtracted after applying the rate. */
  deduct: number;
}

export interface PayrollTaxSettings {
  payeBands: PayeBand[];
  nssaEmployeeRate: number;
  nssaEmployerRate: number;
  nssaInsurableCeiling: number | null;
  aidsLevyRate: number;
}

const EMPTY_TAX_SETTINGS: PayrollTaxSettings = {
  payeBands: [],
  nssaEmployeeRate: 0,
  nssaEmployerRate: 0,
  nssaInsurableCeiling: null,
  aidsLevyRate: 0,
};

export async function getPayrollTaxSettings(supabase: SupabaseClient, orgId: string): Promise<PayrollTaxSettings> {
  const { data, error } = await supabase
    .from("payroll_tax_settings")
    .select("paye_bands, nssa_employee_rate, nssa_employer_rate, nssa_insurable_ceiling, aids_levy_rate")
    .eq("org_id", orgId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_TAX_SETTINGS;

  return {
    payeBands: (data.paye_bands as unknown as Array<{ up_to: number | null; rate: number; deduct: number }>).map((b) => ({
      upTo: b.up_to,
      rate: b.rate,
      deduct: b.deduct,
    })),
    nssaEmployeeRate: data.nssa_employee_rate,
    nssaEmployerRate: data.nssa_employer_rate,
    nssaInsurableCeiling: data.nssa_insurable_ceiling,
    aidsLevyRate: data.aids_levy_rate,
  };
}

export async function updatePayrollTaxSettings(supabase: SupabaseClient, orgId: string, settings: PayrollTaxSettings) {
  const { error } = await supabase.from("payroll_tax_settings").upsert(
    {
      org_id: orgId,
      paye_bands: settings.payeBands.map((b) => ({ up_to: b.upTo, rate: b.rate, deduct: b.deduct })),
      nssa_employee_rate: settings.nssaEmployeeRate,
      nssa_employer_rate: settings.nssaEmployerRate,
      nssa_insurable_ceiling: settings.nssaInsurableCeiling,
      aids_levy_rate: settings.aidsLevyRate,
    },
    { onConflict: "org_id" }
  );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Payroll calculation - standard "quick deduction" progressive PAYE method,
// AIDS levy as a percentage of PAYE payable (the standard ZW relationship),
// NSSA as a percentage of insurable earnings up to an optional ceiling.
// Every rate/band comes from org settings, nothing here is a hardcoded
// statutory figure.
// ---------------------------------------------------------------------------

export function calculatePaye(grossPay: number, bands: PayeBand[]): number {
  if (!bands || bands.length === 0) return 0;
  for (const band of bands) {
    if (band.upTo === null || grossPay <= band.upTo) {
      return Math.max(grossPay * (band.rate / 100) - band.deduct, 0);
    }
  }
  return 0;
}

export interface PayslipLine {
  name: string;
  type: "earning" | "deduction";
  amount: number;
}

export interface PayslipComputation {
  employeeId: string;
  basicSalary: number;
  lines: PayslipLine[];
  grossPay: number;
  payeAmount: number;
  nssaEmployeeAmount: number;
  aidsLevyAmount: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
}

export function computePayslip(
  employee: { id: string; basicSalary: number },
  assignedComponents: Array<{ componentType: "earning" | "deduction"; calculationMethod: "fixed" | "percent_of_basic"; componentName: string; amount: number }>,
  taxSettings: PayrollTaxSettings
): PayslipComputation {
  const lines: PayslipLine[] = [{ name: "Basic Salary", type: "earning", amount: employee.basicSalary }];
  const otherDeductionLines: PayslipLine[] = [];

  for (const c of assignedComponents) {
    const amount = c.calculationMethod === "percent_of_basic" ? (employee.basicSalary * c.amount) / 100 : c.amount;
    if (c.componentType === "earning") {
      lines.push({ name: c.componentName, type: "earning", amount });
    } else {
      otherDeductionLines.push({ name: c.componentName, type: "deduction", amount });
    }
  }

  const grossPay = lines.reduce((sum, l) => sum + l.amount, 0);
  const insurableEarnings =
    taxSettings.nssaInsurableCeiling != null ? Math.min(grossPay, taxSettings.nssaInsurableCeiling) : grossPay;
  const nssaEmployeeAmount = insurableEarnings * (taxSettings.nssaEmployeeRate / 100);
  const payeAmount = calculatePaye(grossPay, taxSettings.payeBands);
  const aidsLevyAmount = payeAmount * (taxSettings.aidsLevyRate / 100);
  const otherDeductions = otherDeductionLines.reduce((sum, l) => sum + l.amount, 0);
  const totalDeductions = payeAmount + aidsLevyAmount + nssaEmployeeAmount + otherDeductions;

  const allLines = [
    ...lines,
    ...(payeAmount > 0 ? [{ name: "PAYE", type: "deduction" as const, amount: payeAmount }] : []),
    ...(nssaEmployeeAmount > 0 ? [{ name: "NSSA", type: "deduction" as const, amount: nssaEmployeeAmount }] : []),
    ...(aidsLevyAmount > 0 ? [{ name: "AIDS Levy", type: "deduction" as const, amount: aidsLevyAmount }] : []),
    ...otherDeductionLines,
  ];

  return {
    employeeId: employee.id,
    basicSalary: employee.basicSalary,
    lines: allLines,
    grossPay,
    payeAmount,
    nssaEmployeeAmount,
    aidsLevyAmount,
    otherDeductions,
    totalDeductions,
    netPay: grossPay - totalDeductions,
  };
}

// ---------------------------------------------------------------------------
// Payroll runs
// ---------------------------------------------------------------------------

export interface PayrollRunListRow {
  id: string;
  run_number: string;
  period_start: string;
  period_end: string;
  pay_date: string | null;
  status: "draft" | "finalized" | "paid";
  total_gross: number;
  total_deductions: number;
  total_net: number;
  employeeCount: number;
}

export async function listPayrollRuns(supabase: SupabaseClient, orgId: string): Promise<PayrollRunListRow[]> {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select("id, run_number, period_start, period_end, pay_date, status, total_gross, total_deductions, total_net, payslips(count)")
    .eq("org_id", orgId)
    .order("period_start", { ascending: false });
  if (error) throw error;

  return (
    data as unknown as Array<
      Omit<PayrollRunListRow, "employeeCount"> & { payslips: Array<{ count: number }> }
    >
  ).map((row) => ({
    ...row,
    employeeCount: row.payslips?.[0]?.count ?? 0,
  }));
}

export interface PayrollRunInput {
  branchId: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  notes: string;
  employeeIds: string[];
}

export async function createPayrollRun(supabase: SupabaseClient, orgId: string, input: PayrollRunInput): Promise<string> {
  if (input.employeeIds.length === 0) throw new Error("Select at least one employee.");

  const [{ data: compensation, error: empError }, taxSettings, { data: runNumber, error: numError }] = await Promise.all([
    supabase.from("employee_compensation").select("employee_id, basic_salary").in("employee_id", input.employeeIds),
    getPayrollTaxSettings(supabase, orgId),
    supabase.rpc("next_number", { target_org_id: orgId, p_entity_type: "payroll_run" }),
  ]);
  if (empError) throw empError;
  if (numError) throw numError;

  const basicSalaryByEmployee = new Map(
    ((compensation ?? []) as Array<{ employee_id: string; basic_salary: number }>).map((c) => [c.employee_id, c.basic_salary])
  );
  const employeeRows = input.employeeIds.map((id) => ({ id, basic_salary: basicSalaryByEmployee.get(id) ?? 0 }));

  const { data: allAssignments, error: assignError } = await supabase
    .from("employee_salary_components")
    .select("employee_id, amount, salary_components(name, component_type, calculation_method)")
    .in("employee_id", input.employeeIds)
    .eq("is_active", true);
  if (assignError) throw assignError;

  const assignmentsByEmployee = new Map<
    string,
    Array<{ componentType: "earning" | "deduction"; calculationMethod: "fixed" | "percent_of_basic"; componentName: string; amount: number }>
  >();
  for (const row of (allAssignments ?? []) as unknown as Array<{
    employee_id: string;
    amount: number;
    salary_components: { name: string; component_type: "earning" | "deduction"; calculation_method: "fixed" | "percent_of_basic" } | null;
  }>) {
    if (!row.salary_components) continue;
    const list = assignmentsByEmployee.get(row.employee_id) ?? [];
    list.push({
      componentType: row.salary_components.component_type,
      calculationMethod: row.salary_components.calculation_method,
      componentName: row.salary_components.name,
      amount: row.amount,
    });
    assignmentsByEmployee.set(row.employee_id, list);
  }

  const computations = employeeRows.map((e) =>
    computePayslip({ id: e.id, basicSalary: e.basic_salary }, assignmentsByEmployee.get(e.id) ?? [], taxSettings)
  );

  const totalGross = computations.reduce((sum, c) => sum + c.grossPay, 0);
  const totalDeductions = computations.reduce((sum, c) => sum + c.totalDeductions, 0);
  const totalNet = computations.reduce((sum, c) => sum + c.netPay, 0);

  const { data: run, error: runError } = await supabase
    .from("payroll_runs")
    .insert({
      org_id: orgId,
      branch_id: input.branchId || null,
      run_number: runNumber,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      pay_date: input.payDate || null,
      notes: input.notes || null,
      total_gross: totalGross,
      total_deductions: totalDeductions,
      total_net: totalNet,
    })
    .select("id")
    .single();
  if (runError) throw runError;

  const { data: insertedPayslips, error: payslipError } = await supabase
    .from("payslips")
    .insert(
      computations.map((c) => ({
        org_id: orgId,
        payroll_run_id: run.id,
        employee_id: c.employeeId,
        basic_salary: c.basicSalary,
        gross_pay: c.grossPay,
        paye_amount: c.payeAmount,
        nssa_employee_amount: c.nssaEmployeeAmount,
        aids_levy_amount: c.aidsLevyAmount,
        other_deductions: c.otherDeductions,
        net_pay: c.netPay,
      }))
    )
    .select("id, employee_id");
  if (payslipError) throw payslipError;

  const payslipIdByEmployee = new Map((insertedPayslips as Array<{ id: string; employee_id: string }>).map((p) => [p.employee_id, p.id]));

  const lineRows = computations.flatMap((c) => {
    const payslipId = payslipIdByEmployee.get(c.employeeId);
    if (!payslipId) return [];
    return c.lines.map((l) => ({
      payslip_id: payslipId,
      component_name: l.name,
      component_type: l.type,
      amount: l.amount,
    }));
  });

  if (lineRows.length > 0) {
    const { error: lineError } = await supabase.from("payslip_lines").insert(lineRows);
    if (lineError) throw lineError;
  }

  return run.id as string;
}

export async function setPayrollRunStatus(supabase: SupabaseClient, runId: string, status: "draft" | "finalized" | "paid") {
  const { error } = await supabase.from("payroll_runs").update({ status }).eq("id", runId);
  if (error) throw error;
}

export interface PayslipDetailRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  basicSalary: number;
  grossPay: number;
  payeAmount: number;
  nssaEmployeeAmount: number;
  aidsLevyAmount: number;
  otherDeductions: number;
  netPay: number;
  lines: PayslipLine[];
}

export interface PayrollRunDetail {
  id: string;
  run_number: string;
  period_start: string;
  period_end: string;
  pay_date: string | null;
  status: "draft" | "finalized" | "paid";
  notes: string | null;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  branchName: string | null;
  payslips: PayslipDetailRow[];
}

export async function getPayrollRun(supabase: SupabaseClient, orgId: string, runId: string): Promise<PayrollRunDetail | null> {
  const { data: run, error: runError } = await supabase
    .from("payroll_runs")
    .select("id, run_number, period_start, period_end, pay_date, status, notes, total_gross, total_deductions, total_net, branches(name)")
    .eq("org_id", orgId)
    .eq("id", runId)
    .maybeSingle();
  if (runError) throw runError;
  if (!run) return null;

  const { data: payslips, error: payslipError } = await supabase
    .from("payslips")
    .select(
      "id, employee_id, basic_salary, gross_pay, paye_amount, nssa_employee_amount, aids_levy_amount, other_deductions, net_pay, employees(full_name, employee_number), payslip_lines(component_name, component_type, amount)"
    )
    .eq("payroll_run_id", runId)
    .order("created_at");
  if (payslipError) throw payslipError;

  const row = run as unknown as Omit<PayrollRunDetail, "branchName" | "payslips"> & { branches: { name: string } | null };

  return {
    ...row,
    branchName: row.branches?.name ?? null,
    payslips: (
      payslips as unknown as Array<{
        id: string;
        employee_id: string;
        basic_salary: number;
        gross_pay: number;
        paye_amount: number;
        nssa_employee_amount: number;
        aids_levy_amount: number;
        other_deductions: number;
        net_pay: number;
        employees: { full_name: string; employee_number: string } | null;
        payslip_lines: Array<{ component_name: string; component_type: "earning" | "deduction"; amount: number }>;
      }>
    ).map((p) => ({
      id: p.id,
      employeeId: p.employee_id,
      employeeName: p.employees?.full_name ?? "Unknown employee",
      employeeNumber: p.employees?.employee_number ?? "",
      basicSalary: p.basic_salary,
      grossPay: p.gross_pay,
      payeAmount: p.paye_amount,
      nssaEmployeeAmount: p.nssa_employee_amount,
      aidsLevyAmount: p.aids_levy_amount,
      otherDeductions: p.other_deductions,
      netPay: p.net_pay,
      lines: p.payslip_lines.map((l) => ({ name: l.component_name, type: l.component_type, amount: l.amount })),
    })),
  };
}
