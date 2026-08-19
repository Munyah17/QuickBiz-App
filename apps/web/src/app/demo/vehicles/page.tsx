"use client";

import { useState } from "react";
import { Plus, Car, Fuel } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

function AddVehicleModal({ onClose }: { onClose: () => void }) {
  const { addVehicle } = useDemo();
  const { push } = useToast();
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [driverName, setDriverName] = useState("");

  return (
    <Modal open onClose={onClose} title="Add vehicle">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!registrationNumber.trim()) return;
          addVehicle({ registrationNumber: registrationNumber.trim(), make: make.trim(), model: model.trim(), driverName: driverName.trim() });
          push("Vehicle added");
          onClose();
        }}
      >
        <FormField label="Registration number" htmlFor="registrationNumber" required>
          <Input id="registrationNumber" required value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Make" htmlFor="make">
            <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} />
          </FormField>
          <FormField label="Model" htmlFor="model">
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Driver" htmlFor="driverName">
          <Input id="driverName" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add vehicle</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoVehiclesPage() {
  const { vehicles, logFuel } = useDemo();
  const { push } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Fleet" title="Vehicles" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        {vehicles.length === 0 ? (
          <EmptyState icon={Car} title="No vehicles yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Registration</th>
                <th className="px-4 py-2.5">Vehicle</th>
                <th className="px-4 py-2.5">Driver</th>
                <th className="px-4 py-2.5">Odometer</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{v.registrationNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{[v.make, v.model].filter(Boolean).join(" ") || "Not specified"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{v.driverName || "No driver assigned"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{v.odometerKm.toLocaleString()} km</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="success">{v.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        logFuel(v.id, 50);
                        push("Fuel logged, odometer updated");
                      }}
                    >
                      <Fuel className="size-4" />
                      Log Fuel
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <AddVehicleModal onClose={() => setOpen(false)} />}
    </div>
  );
}
