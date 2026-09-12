"use client";

import { useActionState, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { NewFloatModal } from "./NewFloatModal";
import { recordTransactionAction, closeFloatAction, initialPettyCashActionState } from "./actions";
import type { PettyCashFloatRow } from "@/services/pettyCash";

const TRANSACTION_TYPES = ["disbursement", "replenish", "reimbursement", "adjustment"];

const STATUS_TONE: Record<PettyCashFloatRow["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  active: "success",
  inactive: "neutral",
  closed: "neutral",
};

function RecordTransactionModal({
  float,
  employees,
  onClose,
}: {
  float: PettyCashFloatRow;
  employees: Array<{ id: string; fullName: string }>;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(recordTransactionAction, initialPettyCashActionState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) {
      push("Petty cash transaction recorded");
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open onClose={onClose} title={`Record Transaction - ${float.fundName}`}>
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="pettyCashId" value={float.id} />

        <FormField label="Transaction Type" htmlFor="transactionType">
          <Select id="transactionType" name="transactionType" defaultValue={TRANSACTION_TYPES[0]}>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Amount" htmlFor="amount">
          <Input id="amount" name="amount" type="number" min="0" step="0.01" required />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <Textarea id="description" name="description" required />
        </FormField>

        <FormField label="Category" htmlFor="category">
          <Input id="category" name="category" />
        </FormField>

        <FormField label="Receipt Number" htmlFor="receiptNumber">
          <Input id="receiptNumber" name="receiptNumber" />
        </FormField>

        <FormField label="Recipient" htmlFor="recipientId">
          <Select id="recipientId" name="recipientId" defaultValue="">
            <option value="">No recipient</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName}
              </option>
            ))}
          </Select>
        </FormField>

        {state.error && <p className="text-sm text-danger-600">{state.error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Record Transaction
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function FloatsTable({
  floats,
  projects,
  employees,
}: {
  floats: PettyCashFloatRow[];
  projects: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; fullName: string }>;
}) {
  const [transactionFloat, setTransactionFloat] = useState<PettyCashFloatRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { push } = useToast();

  async function handleClose(floatId: string) {
    setBusyId(floatId);
    try {
      await closeFloatAction(floatId);
      push("Petty cash float closed");
    } catch (err) {
      push((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader title="Petty Cash Floats" action={<NewFloatModal projects={projects} employees={employees} />} />
      {floats.length === 0 ? (
        <EmptyState icon={Wallet} title="No petty cash floats" description="Issue a float against a project to start tracking petty cash disbursements against it." />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
              <th className="px-4 py-2.5">Project</th>
              <th className="px-4 py-2.5">Fund</th>
              <th className="px-4 py-2.5">Custodian</th>
              <th className="px-4 py-2.5">Initial</th>
              <th className="px-4 py-2.5">Balance</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {floats.map((f) => (
              <tr key={f.id} className="border-b border-border-subtle last:border-b-0">
                <td className="px-4 py-2.5 text-text-secondary">{f.projectName}</td>
                <td className="px-4 py-2.5 font-medium text-text-primary">{f.fundName}</td>
                <td className="px-4 py-2.5 text-text-secondary">{f.custodianName ?? "Unassigned"}</td>
                <td className="px-4 py-2.5 text-text-secondary">
                  {f.currency} {f.initialAmount.toFixed(2)}
                </td>
                <td className="px-4 py-2.5 font-medium text-text-primary">
                  {f.currency} {f.currentBalance.toFixed(2)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  {f.status !== "closed" && (
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setTransactionFloat(f)}>
                        Record Transaction
                      </Button>
                      <Button variant="secondary" size="sm" loading={busyId === f.id} onClick={() => handleClose(f.id)}>
                        Close
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {transactionFloat && <RecordTransactionModal float={transactionFloat} employees={employees} onClose={() => setTransactionFloat(null)} />}
    </Card>
  );
}
