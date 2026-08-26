"use client";

import { useState } from "react";
import { Plus, Truck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useDemo, type DemoShipment } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const STATUSES: DemoShipment["status"][] = ["pending", "dispatched", "in_transit", "delivered", "failed", "returned"];

function NewShipmentModal({ onClose }: { onClose: () => void }) {
  const { customers, vehicles, createShipment } = useDemo();
  const { push } = useToast();
  const [customerName, setCustomerName] = useState(customers[0]?.name ?? "");
  const [carrier, setCarrier] = useState("");
  const [vehicleRegistration, setVehicleRegistration] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  return (
    <Modal open onClose={onClose} title="New shipment">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!deliveryAddress.trim()) return;
          createShipment({ customerName, carrier: carrier.trim(), vehicleRegistration, deliveryAddress: deliveryAddress.trim() });
          push("Shipment created");
          onClose();
        }}
      >
        <FormField label="Customer" htmlFor="customerName">
          <Select id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Carrier" htmlFor="carrier" hint="Own fleet or a 3rd-party courier">
            <Input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. Swift Logistics" />
          </FormField>
          <FormField label="Vehicle" htmlFor="vehicleRegistration" hint="Optional, from Fleet">
            <Select id="vehicleRegistration" value={vehicleRegistration} onChange={(e) => setVehicleRegistration(e.target.value)}>
              <option value="">Not assigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.registrationNumber}>
                  {v.registrationNumber}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Delivery address" htmlFor="deliveryAddress" required>
          <Textarea id="deliveryAddress" required rows={2} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create shipment</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoShipmentsPage() {
  const { shipments, setShipmentStatus } = useDemo();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Logistics" title="Shipments" />
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New Shipment
        </Button>
      </div>

      <Card>
        {shipments.length === 0 ? (
          <EmptyState icon={Truck} title="No shipments yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Shipment #</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Carrier / Vehicle</th>
                <th className="px-4 py-2.5">Delivery address</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{s.shipmentNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.customerName ?? "Not specified"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{s.carrier ?? (s.vehicleRegistration ? `Own: ${s.vehicleRegistration}` : "Not assigned")}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-text-secondary">{s.deliveryAddress}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={s.status}
                      onChange={(e) => setShipmentStatus(s.id, e.target.value as DemoShipment["status"])}
                      className="h-8 rounded-md border border-border bg-white px-2 text-xs capitalize focus:outline-none"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {open && <NewShipmentModal onClose={() => setOpen(false)} />}
    </div>
  );
}
