"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Wrench, CalendarClock, CheckCircle2, ListChecks } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { SearchInput } from "@/components/SearchInput";
import { useToast } from "@/components/Toast";
import { createWorkshopJobAction, setWorkshopJobStatusAction, initialWorkshopActionState } from "./actions";
import type { WorkshopJobRow } from "@/services/workshop";

const statusTone: Record<string, "info" | "warning" | "success" | "neutral"> = {
  scheduled: "neutral",
  in_progress: "info",
  on_hold: "warning",
  completed: "success",
};
const NEXT: Record<string, { label: string; to: string } | undefined> = {
  scheduled: { label: "Start", to: "in_progress" },
  in_progress: { label: "Complete", to: "completed" },
  on_hold: { label: "Resume", to: "in_progress" },
};

export function WorkshopClient({
  jobs,
  workOrders,
  employees,
  canManage,
  provisionError,
}: {
  jobs: WorkshopJobRow[];
  workOrders: Array<{ id: string; wo_number: string }>;
  employees: Array<{ id: string; full_name: string }>;
  canManage: boolean;
  provisionError: string | null;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  const stats = useMemo(() => ({
    active: jobs.filter((j) => j.status === "in_progress").length,
    scheduled: jobs.filter((j) => j.status === "scheduled").length,
    onHold: jobs.filter((j) => j.status === "on_hold").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  }), [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (!q) return true;
      return [j.job_number, j.product_name, j.technicianName, j.workOrderNumber, j.description].some((f) => f?.toLowerCase().includes(q));
    });
  }, [jobs, query, statusFilter]);

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const r = await setWorkshopJobStatusAction(id, status);
      if (r.success) push("Job updated");
      else if (r.error) push(r.error, "error");
    });
  }

  if (provisionError) {
    return <Card><EmptyState icon={Wrench} title="Workshop isn't provisioned yet" description={`Apply migration 000066_feature_depth (supabase db push). Detail: ${provisionError}`} /></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={ListChecks} label="Scheduled" value={String(stats.scheduled)} sub="queued jobs" />
        <Stat icon={Wrench} label="In progress" value={String(stats.active)} sub="on the floor" />
        <Stat icon={CalendarClock} label="On hold" value={String(stats.onHold)} sub="paused" />
        <Stat icon={CheckCircle2} label="Completed" value={String(stats.completed)} sub="all time" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{filtered.length} of {jobs.length} job cards</h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search job #, product, tech..." />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
              <option value="all">All statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </Select>
            {canManage && <Button size="sm" onClick={() => setOpen(true)}>New job card</Button>}
          </div>
        </div>

        {jobs.length === 0 ? (
          <EmptyState icon={Wrench} title="No workshop jobs" description="Create a job card to schedule work on the floor." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Wrench} title="No jobs match" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Job #</th>
                <th className="px-4 py-2.5">Product / Description</th>
                <th className="px-4 py-2.5">Work order</th>
                <th className="px-4 py-2.5">Technician</th>
                <th className="px-4 py-2.5">Scheduled</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((j) => (
                <tr key={j.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{j.job_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {j.product_name ?? "—"}
                    {j.description && <span className="block text-xs text-text-tertiary">{j.description}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{j.workOrderNumber ?? "—"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{j.technicianName ?? "Unassigned"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {j.scheduled_start ? new Date(j.scheduled_start).toLocaleDateString() : "—"}
                    {j.completed_at && <span className="block text-xs text-success-600">Done {new Date(j.completed_at).toLocaleDateString()}</span>}
                  </td>
                  <td className="px-4 py-2.5"><Badge tone={statusTone[j.status] ?? "neutral"}>{j.status.replace("_", " ")}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      {NEXT[j.status] && (
                        <button type="button" disabled={isPending} onClick={() => setStatus(j.id, NEXT[j.status]!.to)} className="text-xs text-primary-600 hover:underline">{NEXT[j.status]!.label}</button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <JobModal open={open} onClose={() => setOpen(false)} workOrders={workOrders} employees={employees} />
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Wrench; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}

function JobModal({ open, onClose, workOrders, employees }: { open: boolean; onClose: () => void; workOrders: Array<{ id: string; wo_number: string }>; employees: Array<{ id: string; full_name: string }> }) {
  const [state, formAction, isPending] = useActionState(createWorkshopJobAction, initialWorkshopActionState);
  const { push } = useToast();
  useEffect(() => { if (state.success) { push("Job card created"); onClose(); } /* eslint-disable-next-line */ }, [state.success]);
  return (
    <Modal open={open} onClose={onClose} title="New workshop job card">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Work order" htmlFor="wj-wo"><Select id="wj-wo" name="workOrderId"><option value="">None / standalone</option>{workOrders.map((w) => <option key={w.id} value={w.id}>{w.wo_number}</option>)}</Select></FormField>
        <FormField label="Product / item" htmlFor="wj-product"><Input id="wj-product" name="productName" placeholder="What's being made or repaired" /></FormField>
        <FormField label="Description" htmlFor="wj-desc"><Input id="wj-desc" name="description" placeholder="Job details" /></FormField>
        <FormField label="Technician" htmlFor="wj-tech"><Select id="wj-tech" name="technicianId"><option value="">Unassigned</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</Select></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start" htmlFor="wj-start"><Input id="wj-start" name="scheduledStart" type="datetime-local" /></FormField>
          <FormField label="End" htmlFor="wj-end"><Input id="wj-end" name="scheduledEnd" type="datetime-local" /></FormField>
        </div>
        <FormField label="Notes" htmlFor="wj-notes"><Input id="wj-notes" name="notes" placeholder="Optional" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Create job</Button></div>
      </form>
    </Modal>
  );
}
