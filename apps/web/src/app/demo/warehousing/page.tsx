"use client";

import { useState } from "react";
import { Plus, Warehouse, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoWarehouse } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const WAREHOUSE_STATUS_TONE: Record<DemoWarehouse["status"], "neutral" | "success" | "warning" | "danger"> = {
  active: "success",
  inactive: "neutral",
  maintenance: "warning",
  closed: "danger",
};

const ZONE_TYPES = ["receiving", "storage", "picking", "packing", "shipping", "quarantine", "returns"];

function NewWarehouseModal({ onClose }: { onClose: () => void }) {
  const { addWarehouse } = useDemo();
  const { push } = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [managerName, setManagerName] = useState("");

  return (
    <Modal open onClose={onClose} title="Add Warehouse">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          addWarehouse({ code: code.trim(), name: name.trim(), address: address.trim(), managerName: managerName.trim() });
          push("Warehouse added");
          onClose();
        }}
      >
        <FormField label="Code" htmlFor="code">
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        </FormField>
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Address" htmlFor="address">
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </FormField>
        <FormField label="Manager" htmlFor="managerName">
          <Input id="managerName" value={managerName} onChange={(e) => setManagerName(e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Warehouse</Button>
        </div>
      </form>
    </Modal>
  );
}

function NewZoneModal({ warehouses, onClose }: { warehouses: DemoWarehouse[]; onClose: () => void }) {
  const { createWarehouseZone } = useDemo();
  const { push } = useToast();
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [zoneType, setZoneType] = useState(ZONE_TYPES[1]);
  const [capacity, setCapacity] = useState("");

  return (
    <Modal open onClose={onClose} title="Add Storage Zone">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createWarehouseZone({ warehouseId, code: code.trim(), name: name.trim(), zoneType, capacity: capacity.trim() });
          push("Zone added");
          onClose();
        }}
      >
        <FormField label="Warehouse" htmlFor="warehouseId">
          <Select id="warehouseId" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Code" htmlFor="code">
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        </FormField>
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Zone Type" htmlFor="zoneType">
          <Select id="zoneType" value={zoneType} onChange={(e) => setZoneType(e.target.value)}>
            {ZONE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Capacity" htmlFor="capacity">
          <Input id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. 200 sq m" />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Zone</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoWarehousingPage() {
  const { warehouses, warehouseZones } = useDemo();
  const [newWarehouseOpen, setNewWarehouseOpen] = useState(false);
  const [newZoneOpen, setNewZoneOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Warehousing" />

      <p className="text-sm text-text-tertiary">
        Manage warehouses, storage zones, and bins, and track exactly where stock sits inside each site.
      </p>

      <Card>
        <CardHeader
          title="Warehouses"
          action={
            <Button variant="secondary" onClick={() => setNewWarehouseOpen(true)}>
              <Plus className="size-4" />
              Add Warehouse
            </Button>
          }
        />
        {warehouses.length === 0 ? (
          <EmptyState icon={Warehouse} title="No warehouses yet" description="Add a warehouse to start organizing storage zones and bins." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Address</th>
                <th className="px-4 py-2.5">Manager</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((w) => (
                <tr key={w.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">{w.code}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{w.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.address || "-"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{w.managerName || "-"}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={WAREHOUSE_STATUS_TONE[w.status]}>{w.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Storage Zones"
          action={
            <Button variant="secondary" onClick={() => setNewZoneOpen(true)} disabled={warehouses.length === 0}>
              <Plus className="size-4" />
              Add Zone
            </Button>
          }
        />
        {warehouseZones.length === 0 ? (
          <EmptyState icon={LayoutGrid} title="No storage zones yet" description="Add a zone within a warehouse to start organizing storage." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Warehouse</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {warehouseZones.map((z) => (
                <tr key={z.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">{z.code}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{z.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{z.warehouseName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{z.zoneType}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{z.capacity || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {newWarehouseOpen && <NewWarehouseModal onClose={() => setNewWarehouseOpen(false)} />}
      {newZoneOpen && <NewZoneModal warehouses={warehouses} onClose={() => setNewZoneOpen(false)} />}
    </div>
  );
}
