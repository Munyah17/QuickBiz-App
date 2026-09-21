"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { createShipmentAction, initialShipmentActionState } from "./actions";
import type { Customer } from "@/services/customers";
import type { VehicleRow } from "@/services/fleet";
import type { Employee } from "@/services/hr";
import type { InvoiceListRow } from "@/services/sales";
import type { OnlineOrderRow } from "@/services/ecommerce";

function ShipmentForm({
  branchId,
  customers,
  vehicles,
  employees,
  invoices,
  onlineOrders,
  onClose,
}: {
  branchId: string;
  customers: Customer[];
  vehicles: VehicleRow[];
  employees: Employee[];
  invoices: InvoiceListRow[];
  onlineOrders: OnlineOrderRow[];
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(createShipmentAction, initialShipmentActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Shipment created");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title="New shipment">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="branchId" value={branchId} />

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Customer" htmlFor="customerId">
            <Select id="customerId" name="customerId" defaultValue="">
              <option value="">No customer linked</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Carrier" htmlFor="carrier" hint="Own fleet or a 3rd-party courier name">
            <Input id="carrier" name="carrier" placeholder="e.g. Own delivery, Swift Logistics" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Related sales invoice" htmlFor="salesInvoiceId" hint="Optional">
            <Select id="salesInvoiceId" name="salesInvoiceId" defaultValue="">
              <option value="">Not linked</option>
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoice_number} {i.customerName ? `- ${i.customerName}` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Related online order" htmlFor="onlineOrderId" hint="Optional">
            <Select id="onlineOrderId" name="onlineOrderId" defaultValue="">
              <option value="">Not linked</option>
              {onlineOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_number} - {o.buyerName}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Vehicle" htmlFor="vehicleId" hint="Optional, from Fleet">
            <Select id="vehicleId" name="vehicleId" defaultValue="">
              <option value="">Not assigned</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Driver" htmlFor="driverId" hint="Optional, from Employees">
            <Select id="driverId" name="driverId" defaultValue="">
              <option value="">Not assigned</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tracking number" htmlFor="trackingNumber" hint="Optional, your own or the courier's reference">
            <Input id="trackingNumber" name="trackingNumber" />
          </FormField>
          <FormField label="Priority" htmlFor="priority">
            <Select id="priority" name="priority" defaultValue="normal">
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </FormField>
        </div>

        <FormField label="Origin / pickup address" htmlFor="originAddress" hint="Optional — where the shipment is collected">
          <Textarea id="originAddress" name="originAddress" rows={2} />
        </FormField>

        <FormField label="Delivery address" htmlFor="deliveryAddress" required>
          <Textarea id="deliveryAddress" name="deliveryAddress" required rows={2} />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Route" htmlFor="routeDescription" hint="Optional — e.g. via A5, depot → CBD">
            <Input id="routeDescription" name="routeDescription" />
          </FormField>
          <FormField label="ETA" htmlFor="eta" hint="Optional expected arrival">
            <Input id="eta" name="eta" type="datetime-local" />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes" hint="Optional, e.g. access instructions, fragile handling">
          <Textarea id="notes" name="notes" rows={2} />
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Create shipment
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function NewShipmentModal({
  branchId,
  customers,
  vehicles,
  employees,
  invoices,
  onlineOrders,
}: {
  branchId: string;
  customers: Customer[];
  vehicles: VehicleRow[];
  employees: Employee[];
  invoices: InvoiceListRow[];
  onlineOrders: OnlineOrderRow[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        New Shipment
      </Button>
      {open && (
        <ShipmentForm
          branchId={branchId}
          customers={customers}
          vehicles={vehicles}
          employees={employees}
          invoices={invoices}
          onlineOrders={onlineOrders}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
