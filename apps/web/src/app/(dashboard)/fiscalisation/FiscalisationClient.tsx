"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { FileCheck, Cpu, ReceiptText, Landmark } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { SearchInput } from "@/components/SearchInput";
import { ExportButton } from "@/components/ExportButton";
import { useToast } from "@/components/Toast";
import {
  registerDeviceAction,
  fiscaliseReceiptAction,
  createVatReturnAction,
  setDeviceStatusAction,
  setVatReturnStatusAction,
  initialFiscalisationActionState,
} from "./actions";
import type { FiscalDeviceRow, FiscalReceiptRow, VatReturnRow } from "@/services/fiscalisation";

const deviceTone: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  inactive: "neutral",
  suspended: "danger",
};
const receiptTone: Record<string, "success" | "warning" | "danger"> = {
  fiscalised: "success",
  pending: "warning",
  failed: "danger",
};
const vatTone: Record<string, "success" | "info" | "neutral"> = {
  draft: "neutral",
  submitted: "info",
  processed: "success",
};

const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type Tab = "devices" | "receipts" | "vat";

export function FiscalisationClient({
  devices,
  receipts,
  vatReturns,
  branches,
  invoices,
  canManage,
  provisionError,
}: {
  devices: FiscalDeviceRow[];
  receipts: FiscalReceiptRow[];
  vatReturns: VatReturnRow[];
  branches: Array<{ id: string; name: string }>;
  invoices: Array<{ id: string; invoice_number: string }>;
  canManage: boolean;
  provisionError: string | null;
}) {
  const [tab, setTab] = useState<Tab>("devices");
  const [openDevice, setOpenDevice] = useState(false);
  const [openReceipt, setOpenReceipt] = useState(false);
  const [openVat, setOpenVat] = useState(false);
  const { push } = useToast();

  const stats = useMemo(() => {
    const activeDevices = devices.filter((d) => d.status === "active").length;
    const fiscalised = receipts.filter((r) => r.status === "fiscalised").length;
    const vatCollected = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);
    const openReturns = vatReturns.filter((v) => v.status !== "processed").length;
    return { activeDevices, fiscalised, vatCollected, openReturns };
  }, [devices, receipts, vatReturns]);

  if (provisionError) {
    return (
      <Card>
        <EmptyState
          icon={FileCheck}
          title="Fiscalisation isn't provisioned yet"
          description={`The fiscal tables aren't in the database yet — apply migration 000066_feature_depth (supabase db push). Detail: ${provisionError}`}
        />
      </Card>
    );
  }

  return (
    <>
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Cpu} label="Active devices" value={String(stats.activeDevices)} sub={`${devices.length} registered`} />
        <StatCard icon={ReceiptText} label="Fiscalised receipts" value={String(stats.fiscalised)} sub={`${receipts.length} total`} />
        <StatCard icon={FileCheck} label="VAT collected" value={money(stats.vatCollected)} sub="on fiscalised receipts" />
        <StatCard icon={Landmark} label="Open VAT returns" value={String(stats.openReturns)} sub={`${vatReturns.length} filed`} />
      </div>

      {/* Tabs + actions */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div className="flex gap-1">
            {([["devices", "Fiscal Devices"], ["receipts", "Receipts"], ["vat", "VAT Returns"]] as Array<[Tab, string]>).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === k ? "bg-primary-50 text-primary-700" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {canManage && (
            <div className="flex gap-2">
              {tab === "devices" && <Button size="sm" onClick={() => setOpenDevice(true)}>Register device</Button>}
              {tab === "receipts" && <Button size="sm" onClick={() => setOpenReceipt(true)}>Fiscalise receipt</Button>}
              {tab === "vat" && <Button size="sm" onClick={() => setOpenVat(true)}>New VAT return</Button>}
            </div>
          )}
        </div>

        {tab === "devices" && <DevicesTable devices={devices} canManage={canManage} />}
        {tab === "receipts" && <ReceiptsTable receipts={receipts} />}
        {tab === "vat" && <VatTable vatReturns={vatReturns} canManage={canManage} />}
      </Card>

      <RegisterDeviceModal open={openDevice} onClose={() => setOpenDevice(false)} branches={branches} />
      <FiscaliseReceiptModal open={openReceipt} onClose={() => setOpenReceipt(false)} devices={devices} invoices={invoices} />
      <VatReturnModal open={openVat} onClose={() => setOpenVat(false)} />
    </>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Cpu; label: string; value: string; sub: string }) {
  return (
    <Card className="px-4 py-3.5">
      <div className="flex items-center gap-2 text-text-tertiary">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </Card>
  );
}

function DevicesTable({ devices, canManage }: { devices: FiscalDeviceRow[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();
  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const r = await setDeviceStatusAction(id, status);
      if (r.success) push("Device updated");
      else if (r.error) push(r.error, "error");
    });
  }
  if (devices.length === 0) return <EmptyState icon={Cpu} title="No fiscal devices" description="Register a virtual fiscal device to start issuing ZIMRA-compliant receipts." />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
          <th className="px-4 py-2.5">Serial</th>
          <th className="px-4 py-2.5">Model / Branch</th>
          <th className="px-4 py-2.5">ZIMRA device ID</th>
          <th className="px-4 py-2.5">Fiscal day</th>
          <th className="px-4 py-2.5">Last sync</th>
          <th className="px-4 py-2.5">Status</th>
          {canManage && <th className="px-4 py-2.5"></th>}
        </tr>
      </thead>
      <tbody>
        {devices.map((d) => (
          <tr key={d.id} className="border-b border-border-subtle last:border-b-0">
            <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{d.device_serial}</td>
            <td className="px-4 py-2.5 text-text-secondary">
              {d.device_model ?? "—"}
              {d.branchName && <span className="block text-xs text-text-tertiary">{d.branchName}</span>}
            </td>
            <td className="px-4 py-2.5 text-text-secondary">{d.zimra_device_id ?? "Not registered"}</td>
            <td className="px-4 py-2.5 text-text-secondary">Day {d.fiscal_day_number}</td>
            <td className="px-4 py-2.5 text-text-secondary">{d.last_sync_at ? new Date(d.last_sync_at).toLocaleString() : "—"}</td>
            <td className="px-4 py-2.5"><Badge tone={deviceTone[d.status] ?? "neutral"}>{d.status}</Badge></td>
            {canManage && (
              <td className="px-4 py-2.5 text-right">
                {d.status === "active" ? (
                  <button type="button" disabled={isPending} onClick={() => setStatus(d.id, "suspended")} className="text-xs text-danger-600 hover:underline">Suspend</button>
                ) : (
                  <button type="button" disabled={isPending} onClick={() => setStatus(d.id, "active")} className="text-xs text-success-600 hover:underline">Activate</button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReceiptsTable({ receipts }: { receipts: FiscalReceiptRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter((r) =>
      [r.receipt_number, r.invoiceNumber, r.deviceSerial, r.verification_code].some((f) => f?.toLowerCase().includes(q))
    );
  }, [receipts, query]);

  if (receipts.length === 0) return <EmptyState icon={ReceiptText} title="No fiscalised receipts" description="Fiscalise a sales invoice to issue a ZIMRA-compliant receipt." />;
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <SearchInput value={query} onChange={setQuery} placeholder="Search receipt #, invoice, device..." />
        <ExportButton
          filename="fiscal-receipts"
          rows={filtered.map((r) => ({
            "Receipt #": r.receipt_number,
            Invoice: r.invoiceNumber ?? "",
            Device: r.deviceSerial ?? "",
            "Fiscal day": r.fiscal_day_number ?? "",
            Total: r.receipt_total,
            VAT: r.vat_amount,
            "Verification code": r.verification_code ?? "",
            Status: r.status,
            Fiscalised: r.fiscalised_at,
          }))}
        />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
            <th className="px-4 py-2.5">Receipt #</th>
            <th className="px-4 py-2.5">Invoice</th>
            <th className="px-4 py-2.5">Device</th>
            <th className="px-4 py-2.5">Total / VAT</th>
            <th className="px-4 py-2.5">Verification</th>
            <th className="px-4 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
              <td className="px-4 py-2.5 font-mono font-medium text-text-primary">{r.receipt_number}</td>
              <td className="px-4 py-2.5 text-text-secondary">{r.invoiceNumber ?? "—"}</td>
              <td className="px-4 py-2.5 text-text-secondary">
                {r.deviceSerial ?? "—"}
                {r.fiscal_day_number != null && <span className="block text-xs text-text-tertiary">Day {r.fiscal_day_number}</span>}
              </td>
              <td className="px-4 py-2.5 text-text-secondary">
                {money(r.receipt_total)}
                <span className="block text-xs text-text-tertiary">VAT {money(r.vat_amount)}</span>
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-text-tertiary">{r.verification_code ?? "—"}</td>
              <td className="px-4 py-2.5"><Badge tone={receiptTone[r.status] ?? "neutral"}>{r.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function VatTable({ vatReturns, canManage }: { vatReturns: VatReturnRow[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();
  function setStatus(id: string, status: string) {
    startTransition(async () => {
      const r = await setVatReturnStatusAction(id, status);
      if (r.success) push(`Return ${status}`);
      else if (r.error) push(r.error, "error");
    });
  }
  if (vatReturns.length === 0) return <EmptyState icon={Landmark} title="No VAT returns" description="Create a VAT return for a period to track output/input VAT and filing status." />;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
          <th className="px-4 py-2.5">Period</th>
          <th className="px-4 py-2.5">Output VAT</th>
          <th className="px-4 py-2.5">Input VAT</th>
          <th className="px-4 py-2.5">Net payable</th>
          <th className="px-4 py-2.5">Reference</th>
          <th className="px-4 py-2.5">Status</th>
          {canManage && <th className="px-4 py-2.5"></th>}
        </tr>
      </thead>
      <tbody>
        {vatReturns.map((v) => (
          <tr key={v.id} className="border-b border-border-subtle last:border-b-0">
            <td className="px-4 py-2.5 font-medium text-text-primary">
              {v.period_start} → {v.period_end}
            </td>
            <td className="px-4 py-2.5 text-text-secondary">{money(v.output_vat)}</td>
            <td className="px-4 py-2.5 text-text-secondary">{money(v.input_vat)}</td>
            <td className="px-4 py-2.5 font-medium text-text-primary">{money(v.net_vat)}</td>
            <td className="px-4 py-2.5 text-text-secondary">{v.reference ?? "—"}</td>
            <td className="px-4 py-2.5"><Badge tone={vatTone[v.status] ?? "neutral"}>{v.status}</Badge></td>
            {canManage && (
              <td className="px-4 py-2.5 text-right">
                {v.status === "draft" && (
                  <button type="button" disabled={isPending} onClick={() => setStatus(v.id, "submitted")} className="text-xs text-primary-600 hover:underline">Submit</button>
                )}
                {v.status === "submitted" && (
                  <button type="button" disabled={isPending} onClick={() => setStatus(v.id, "processed")} className="text-xs text-success-600 hover:underline">Mark processed</button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function useActionForm(action: (prev: typeof initialFiscalisationActionState, fd: FormData) => Promise<typeof initialFiscalisationActionState>, onDone: () => void) {
  const [state, formAction, isPending] = useActionState(action, initialFiscalisationActionState);
  const { push } = useToast();
  useEffect(() => {
    if (state.success) { push("Saved"); onDone(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);
  return { state, formAction, isPending };
}

function RegisterDeviceModal({ open, onClose, branches }: { open: boolean; onClose: () => void; branches: Array<{ id: string; name: string }> }) {
  const { state, formAction, isPending } = useActionForm(registerDeviceAction, onClose);
  return (
    <Modal open={open} onClose={onClose} title="Register fiscal device">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Branch" htmlFor="fd-branch"><Select id="fd-branch" name="branchId"><option value="">Head office / none</option>{branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></FormField>
        <FormField label="Device serial" htmlFor="fd-serial" required><Input id="fd-serial" name="deviceSerial" required placeholder="e.g. FD-0001" /></FormField>
        <FormField label="Device model" htmlFor="fd-model"><Input id="fd-model" name="deviceModel" placeholder="e.g. Virtual FDMS" /></FormField>
        <FormField label="ZIMRA device ID" htmlFor="fd-zid"><Input id="fd-zid" name="zimraDeviceId" placeholder="Assigned by ZIMRA on registration" /></FormField>
        <FormField label="Certificate thumbprint" htmlFor="fd-cert"><Input id="fd-cert" name="certificateThumbprint" placeholder="Optional" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Register</Button></div>
      </form>
    </Modal>
  );
}

function FiscaliseReceiptModal({ open, onClose, devices, invoices }: { open: boolean; onClose: () => void; devices: FiscalDeviceRow[]; invoices: Array<{ id: string; invoice_number: string }> }) {
  const { state, formAction, isPending } = useActionForm(fiscaliseReceiptAction, onClose);
  const activeDevices = devices.filter((d) => d.status === "active");
  return (
    <Modal open={open} onClose={onClose} title="Fiscalise receipt">
      <form action={formAction} className="flex flex-col gap-4">
        <FormField label="Fiscal device" htmlFor="fr-device" required>
          <Select id="fr-device" name="deviceId" required>
            <option value="">Select device…</option>
            {activeDevices.map((d) => <option key={d.id} value={d.id}>{d.device_serial} (day {d.fiscal_day_number})</option>)}
          </Select>
        </FormField>
        <FormField label="Sales invoice" htmlFor="fr-invoice">
          <Select id="fr-invoice" name="salesInvoiceId">
            <option value="">None / walk-in</option>
            {invoices.map((i) => <option key={i.id} value={i.id}>{i.invoice_number}</option>)}
          </Select>
        </FormField>
        <FormField label="Receipt total" htmlFor="fr-total" required><Input id="fr-total" name="receiptTotal" type="number" step="0.01" min="0" required /></FormField>
        <FormField label="VAT amount" htmlFor="fr-vat"><Input id="fr-vat" name="vatAmount" type="number" step="0.01" min="0" defaultValue="0" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Fiscalise</Button></div>
      </form>
    </Modal>
  );
}

function VatReturnModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, formAction, isPending } = useActionForm(createVatReturnAction, onClose);
  return (
    <Modal open={open} onClose={onClose} title="New VAT return">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Period start" htmlFor="vr-start" required><Input id="vr-start" name="periodStart" type="date" required /></FormField>
          <FormField label="Period end" htmlFor="vr-end" required><Input id="vr-end" name="periodEnd" type="date" required /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Output VAT (sales)" htmlFor="vr-out"><Input id="vr-out" name="outputVat" type="number" step="0.01" min="0" defaultValue="0" /></FormField>
          <FormField label="Input VAT (purchases)" htmlFor="vr-in"><Input id="vr-in" name="inputVat" type="number" step="0.01" min="0" defaultValue="0" /></FormField>
        </div>
        <FormField label="Reference" htmlFor="vr-ref"><Input id="vr-ref" name="reference" placeholder="ZIMRA submission ref" /></FormField>
        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" loading={isPending}>Create return</Button></div>
      </form>
    </Modal>
  );
}
