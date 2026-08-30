"use client";

import { useMemo, useState, useTransition } from "react";
import { Truck } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SearchInput } from "@/components/SearchInput";
import { Select } from "@/components/Input";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import { LogFuelModal } from "./LogFuelModal";
import { StatusSelect } from "./StatusSelect";
import { bulkSetVehicleStatusAction } from "./actions";
import type { VehicleRow } from "@/services/fleet";

const statusTone: Record<string, "success" | "warning" | "neutral"> = {
  active: "success",
  in_maintenance: "warning",
  inactive: "neutral",
};

export function VehiclesTable({ vehicles, canManage }: { vehicles: VehicleRow[]; canManage: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, startBulkTransition] = useTransition();
  const { push } = useToast();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles.filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (!q) return true;
      return [v.registration_number, v.make, v.model, v.driverName, v.branchName].some((field) =>
        field?.toLowerCase().includes(q)
      );
    });
  }, [vehicles, query, statusFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((v) => selected.has(v.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allFilteredSelected ? new Set() : new Set(filtered.map((v) => v.id)));
  }

  function runBulk(status: string) {
    const ids = Array.from(selected);
    startBulkTransition(async () => {
      const result = await bulkSetVehicleStatusAction(ids, status);
      if (result.success) {
        push(`${ids.length} vehicle${ids.length === 1 ? "" : "s"} updated`);
        setSelected(new Set());
      } else if (result.error) {
        push(result.error, "error");
      }
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">
          {filtered.length} of {vehicles.length} vehicles
        </h3>
        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchInput value={query} onChange={setQuery} placeholder="Search registration, make, driver..." />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="in_maintenance">In maintenance</option>
            <option value="inactive">Inactive</option>
          </Select>
          <ExportButton
            filename="vehicles"
            rows={filtered.map((v) => ({
              Registration: v.registration_number,
              Make: v.make ?? "",
              Model: v.model ?? "",
              Year: v.year ?? "",
              Driver: v.driverName ?? "",
              Branch: v.branchName ?? "",
              "Odometer (km)": v.odometer_km,
              Status: v.status,
            }))}
          />
        </div>
      </div>

      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 border-b border-border-subtle bg-primary-50 px-4 py-2.5">
          <span className="text-sm font-medium text-text-primary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("active")}>
            Mark Active
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("in_maintenance")}>
            Mark In Maintenance
          </Button>
          <Button size="sm" variant="secondary" loading={isBulkPending} onClick={() => runBulk("inactive")}>
            Mark Inactive
          </Button>
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-sm text-text-tertiary hover:text-text-primary">
            Clear selection
          </button>
        </div>
      )}

      {vehicles.length === 0 ? (
        <EmptyState icon={Truck} title="No vehicles yet" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No vehicles match your search" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              {canManage && (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} className="size-4 rounded border-border" />
                </th>
              )}
              <th className="px-4 py-2.5">Registration</th>
              <th className="px-4 py-2.5">Vehicle</th>
              <th className="px-4 py-2.5">Driver</th>
              <th className="px-4 py-2.5">Branch</th>
              <th className="px-4 py-2.5">Odometer</th>
              <th className="px-4 py-2.5">Status</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-border-subtle last:border-b-0">
                {canManage && (
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(v.id)}
                      onChange={() => toggleOne(v.id)}
                      className="size-4 rounded border-border"
                    />
                  </td>
                )}
                <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{v.registration_number}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {[v.make, v.model, v.year].filter(Boolean).join(" ") || "Not specified"}
                </td>
                <td className="px-4 py-2.5 text-text-secondary">{v.driverName ?? "No driver assigned"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{v.branchName ?? "No branch"}</td>
                <td className="px-4 py-2.5 text-text-secondary">{v.odometer_km.toLocaleString()} km</td>
                <td className="px-4 py-2.5">
                  {canManage ? (
                    <StatusSelect vehicleId={v.id} status={v.status} />
                  ) : (
                    <Badge tone={statusTone[v.status] ?? "neutral"}>{v.status.replace("_", " ")}</Badge>
                  )}
                </td>
                {canManage && (
                  <td className="px-4 py-2.5 text-right">
                    <LogFuelModal vehicleId={v.id} registration={v.registration_number} currentOdometer={v.odometer_km} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
