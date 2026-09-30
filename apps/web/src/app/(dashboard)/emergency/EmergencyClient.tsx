"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { Siren, AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { SearchInput } from "@/components/SearchInput";
import { useToast } from "@/components/Toast";
import { reportIncidentAction, setIncidentStatusAction, initialEmergencyActionState } from "./actions";
import type { EmergencyIncidentRow } from "@/services/logistics";

const severityTone: Record<string, "warning" | "danger" | "info" | "neutral"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
  critical: "danger",
};
const statusTone: Record<string, "warning" | "success"> = { open: "warning", resolved: "success" };

export function EmergencyClient({
  incidents,
  shipments,
  vehicles,
  canManage,
  provisionError,
}: {
  incidents: EmergencyIncidentRow[];
  shipments: Array<{ id: string; shipment_number: string }>;
  vehicles: Array<{ id: string; registration_number: string }>;
  canManage: boolean;
  provisionError: string | null;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  const stats = useMemo(() => ({
    open: incidents.filter((i) => i.status === "open").length,
    critical: incidents.filter((i) => i.severity === "critical" && i.status === "open").length,
    resolved: incidents.filter((i) => i.status === "resolved").length,
    total: incidents.length,
  }), [incidents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return incidents.filter((i) =>
      !q || [i.incident_number, i.shipmentNumber, i.vehicleRegistration, i.location, i.description, i.type].some((f) => f?.toLowerCase().includes(q))
    );
  }, [incidents, query]);

  function resolve(id: string) {
    startTransition(async () => {
      const r = await setIncidentStatusAction(id, "resolved");
      if (r.success) push("Incident resolved");
      else if (r.error) push(r.error, "error");
    });
  }

  if (provisionError) {
    return <Card><EmptyState icon={Siren} title="Emergency isn't provisioned yet" description={`Apply migration 000066_feature_depth (supabase db push). Detail: ${provisionError}`} /></Card>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Siren} label="Open incidents" value={String(stats.open)} sub="need attention" />
        <Stat icon={AlertOctagon} label="Critical" value={String(stats.critical)} sub="open, high severity" />
        <Stat icon={CheckCircle2} label="Resolved" value={String(stats.resolved)} sub="closed" />
        <Stat icon={Clock} label="Total logged" value={String(stats.total)} sub="all time" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-text-primary">{filtered.length} of {incidents.length} incidents</h3>
          <div className="flex flex-1 items-center justify-end gap-2">
            <SearchInput value={query} onChange={setQuery} placeholder="Search incident #, location, vehicle..." />
            {canManage && <Button size="sm" onClick={() => setOpen(true)}>Report incident</Button>}
          </div>
        </div>

        {incidents.length === 0 ? (
          <EmptyState icon={Siren} title="No incidents" description="Report breakdowns, accidents, theft or delays affecting shipments and vehicles." />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Siren} title="No incidents match" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Incident #</th>
                <th className="px-4 py-2.5">Type / Severity</th>
                <th className="px-4 py-2.5">Linked</th>
                <th className="px-4 py-2.5">Location</th>
                <th className="px-4 py-2.5">Reported</th>
                <th className="px-4 py-2.5">Status</th>
                {canManage && <th className="px-4 py-2.5"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{i.incident_number}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    <span className="capitalize">{i.type}</span>{" "}
                    <Badge tone={severityTone[i.severity] ?? "neutral"}>{i.severity}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {i.shipmentNumber ?? "—"}
                    {i.vehicleRegistration && <span className="block text-xs text-text-tertiary">{i.vehicleRegistration}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {i.location ?? "—"}
                    {i.description && <span className="block max-w-xs truncate text-xs text-text-tertiary">{i.description}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {new Date(i.reported_at).toLocaleString()}
                    {i.resolved_at && <span className="block text-xs text-success-600">Resolved {new Date(i.resolved_at).toLocaleDateString()}</span>}
                  </td>
                  <td className="px-4 py-2.5"><Badge tone={statusTone[i.status]}>{i.status}</Badge></td>
                  {canManage && (
                    <td className="px-4 py-2.5 text-right">
                      {i.status === "open" && <button type="button" disabled={isPending} onClick={() => resolve(i.id)} className="text-xs text-success-600 hover:underline">Resolve</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <IncidentModal open={open} onClose={() => setOpen(false)} shipments={shipments} vehicles={vehicles} />
    </>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Siren; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary"><Icon className="size-4" /><span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}

function IncidentModal({ open, onClose, shipments, vehicles }: { open: boolean; onClose: () => void; shipments: Array<{ id: string; shipment_number: string }>; vehicles: Array<{ id: string; registration_number: string }> }) {
  const [state, formAction, isPending] = useActionState(reportIncidentAction, initialEmergencyActionState);
  const { push } = useToast();
  useEffect(() => { if (state.success) { push("Incident reported"); onClose(); } /* eslint-disable-next-line */ }, [state.success]);
  return (
    <Modal open={open} onClose={onClose} title="Report emergency incident">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" htmlFor="ei-type"><Select id="ei-type" name="type" defaultValue="breakdown"><option value="breakdown">Breakdown</option><option value="accident">Accident</option><option value="theft">Theft</option><option value="delay">Delay</option><option value="other">Other</option></Select></FormField>
          <FormField label="Severity" htmlFor="ei-sev"><Select id="ei-sev" name="severity" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Shipment" htmlFor="ei-ship"><Select id="ei-ship" name="shipmentId"><option value="">None</option>{shipments.map((s) => <option key={s.id} value={s.id}>{s.shipment_number}</option>)}</Select></FormField>
          <FormField label="Vehicle" htmlFor="ei-veh"><Select id="ei-veh" name="vehicleId"><option value="">None</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration_number}</option>)}</Select></FormField>
        </div>
        <FormField label="Location" htmlFor="ei-loc"><Input id="ei-loc" name="location" placeholder="Where did it happen" /></FormField>
        <FormField label="Description" htmlFor="ei-desc"><Textarea id="ei-desc" name="description" rows={3} placeholder="What happened" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Report</Button></div>
      </form>
    </Modal>
  );
}
