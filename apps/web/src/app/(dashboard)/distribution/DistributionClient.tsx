"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Route, Truck, Play, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { SearchInput } from "@/components/SearchInput";
import { useToast } from "@/components/Toast";
import { createRouteAction, setRouteStatusAction, initialDistributionActionState } from "./actions";
import type { DistributionRouteRow } from "@/services/logistics";

const statusTone: Record<string, "info" | "warning" | "success" | "neutral"> = {
  planned: "neutral",
  active: "info",
  completed: "success",
};

export function DistributionClient({
  routes,
  vehicles,
  employees,
  canManage,
  provisionError,
}: {
  routes: DistributionRouteRow[];
  vehicles: Array<{ id: string; registration_number: string }>;
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
    planned: routes.filter((r) => r.status === "planned").length,
    active: routes.filter((r) => r.status === "active").length,
    completed: routes.filter((r) => r.status === "completed").length,
    stops: routes.reduce((s, r) => s + (Array.isArray(r.stops) ? r.stops.length : 0), 0),
  }), [routes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return routes.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.route_name, r.vehicleRegistration, r.driverName].some((f) => f?.toLowerCase().includes(q));
    });
  }, [routes, query, statusFilter]);

  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const r = await setRouteStatusAction(id, status);
      if (r.success) push(`Route ${status}`);
      else if (r.error) push(r.error, "error");
    });
  }

  if (provisionError) {
    return <Card><EmptyState icon={Route} title="Distribution isn't provisioned yet" description={`Apply migration 000066_feature_depth (supabase db push). Detail: ${provisionError}`} /></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Route} label="Planned" value={String(stats.planned)} sub="routes queued" />
        <Stat icon={Truck} label="Active" value={String(stats.active)} sub="out now" />
        <Stat icon={CheckCircle2} label="Completed" value={String(stats.completed)} sub="finished" />
        <Stat icon={Play} label="Total stops" value={String(stats.stops)} sub="across all routes" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{filtered.length} of {routes.length} routes</h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search route, vehicle, driver..." />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
              <option value="all">All statuses</option>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
            {canManage && <Button size="sm" onClick={() => setOpen(true)}>New route</Button>}
          </div>
        </div>

        {routes.length === 0 ? (
          <EmptyState icon={Route} title="No distribution routes" description="Plan a route with stops and assign a vehicle and driver." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Route} title="No routes match" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Route</th>
                <th className="px-4 py-2.5">Vehicle / Driver</th>
                <th className="px-4 py-2.5">Stops</th>
                <th className="px-4 py-2.5">Scheduled</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">
                    {r.route_name}
                    {r.notes && <span className="block text-xs font-normal text-text-tertiary">{r.notes}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {r.vehicleRegistration ?? "—"}
                    {r.driverName && <span className="block text-xs text-text-tertiary">{r.driverName}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{Array.isArray(r.stops) ? `${r.stops.length} stops` : "—"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.scheduled_date ?? "—"}</td>
                  <td className="px-4 py-2.5"><Badge tone={statusTone[r.status] ?? "neutral"}>{r.status}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      {r.status === "planned" && <button type="button" disabled={isPending} onClick={() => setStatus(r.id, "active")} className="text-xs text-primary-600 hover:underline">Start</button>}
                      {r.status === "active" && <button type="button" disabled={isPending} onClick={() => setStatus(r.id, "completed")} className="text-xs text-success-600 hover:underline">Complete</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <RouteModal open={open} onClose={() => setOpen(false)} vehicles={vehicles} employees={employees} />
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Route; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}

function RouteModal({ open, onClose, vehicles, employees }: { open: boolean; onClose: () => void; vehicles: Array<{ id: string; registration_number: string }>; employees: Array<{ id: string; full_name: string }> }) {
  const [state, formAction, isPending] = useActionState(createRouteAction, initialDistributionActionState);
  const { push } = useToast();
  useEffect(() => { if (state.success) { push("Route created"); onClose(); } /* eslint-disable-next-line */ }, [state.success]);
  return (
    <Modal open={open} onClose={onClose} title="New distribution route">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Route name" htmlFor="rt-name" required><Input id="rt-name" name="routeName" required placeholder="e.g. CBD morning run" /></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Vehicle" htmlFor="rt-veh"><Select id="rt-veh" name="vehicleId"><option value="">Select vehicle…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}</Select></FormField>
          <FormField label="Driver" htmlFor="rt-driver"><Select id="rt-driver" name="driverId"><option value="">Select driver…</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</Select></FormField>
        </div>
        <FormField label="Scheduled date" htmlFor="rt-date"><Input id="rt-date" name="scheduledDate" type="date" /></FormField>
        <FormField label="Stops (one per line)" htmlFor="rt-stops"><Textarea id="rt-stops" name="stops" rows={3} placeholder={"Shop A\nShop B\nWarehouse drop"} /></FormField>
        <FormField label="Notes" htmlFor="rt-notes"><Input id="rt-notes" name="notes" placeholder="Optional" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Create route</Button></div>
      </form>
    </Modal>
  );
}
