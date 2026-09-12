"use client";

import { useState } from "react";
import { Wallet, Receipt } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useDemo, type DemoPettyCashFloat } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const CATEGORIES = ["supplies", "transport", "delivery", "meals", "maintenance", "other"];

const STATUS_TONE: Record<DemoPettyCashFloat["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  active: "success",
  inactive: "neutral",
  closed: "neutral",
};

export default function DemoPettyCashPage() {
  const { pettyCashFloats, pettyCashTransactions, issuePettyCashFloat, recordPettyCashTransaction } = useDemo();
  const { push } = useToast();

  const [projectName, setProjectName] = useState("");
  const [custodianName, setCustodianName] = useState("");
  const [amountIssued, setAmountIssued] = useState(0);

  const activeFloats = pettyCashFloats.filter((f) => f.status !== "closed");
  const [floatId, setFloatId] = useState(activeFloats[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState(CATEGORIES[0]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Petty Cash" />

      <p className="text-sm text-text-tertiary">
        Issue project petty cash floats to a custodian and track every disbursement against the fund&apos;s remaining
        balance.
      </p>

      <Card>
        <CardHeader title="Petty Cash Floats" />
        <form
          className="flex flex-col gap-4 border-b border-border-subtle p-4 sm:flex-row sm:items-end sm:flex-wrap"
          onSubmit={(e) => {
            e.preventDefault();
            if (!projectName || !custodianName || !amountIssued) return;
            issuePettyCashFloat({ projectName, custodianName, amountIssued });
            push("Petty cash float issued");
            setProjectName("");
            setCustodianName("");
            setAmountIssued(0);
          }}
        >
          <div className="flex-1 min-w-[160px]">
            <FormField label="Project" htmlFor="projectName" required>
              <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
            </FormField>
          </div>
          <div className="flex-1 min-w-[160px]">
            <FormField label="Custodian" htmlFor="custodianName" required>
              <Input id="custodianName" value={custodianName} onChange={(e) => setCustodianName(e.target.value)} required />
            </FormField>
          </div>
          <div className="flex-1 min-w-[140px]">
            <FormField label="Initial Amount" htmlFor="amountIssued" required>
              <Input id="amountIssued" type="number" min="0" step="0.01" value={amountIssued} onChange={(e) => setAmountIssued(Number(e.target.value))} required />
            </FormField>
          </div>
          <Button type="submit">Issue Float</Button>
        </form>

        {pettyCashFloats.length === 0 ? (
          <EmptyState icon={Wallet} title="No petty cash floats" description="Issue a float against a project to start tracking petty cash disbursements against it." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Project</th>
                <th className="px-4 py-2.5">Custodian</th>
                <th className="px-4 py-2.5">Issued</th>
                <th className="px-4 py-2.5">Remaining</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {pettyCashFloats.map((f) => (
                <tr key={f.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{f.projectName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{f.custodianName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{f.amountIssued.toFixed(2)}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{f.amountRemaining.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[f.status]}>{f.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader title="Petty Cash Transactions" />
        {activeFloats.length > 0 && (
          <form
            className="flex flex-col gap-4 border-b border-border-subtle p-4 sm:flex-row sm:items-end sm:flex-wrap"
            onSubmit={(e) => {
              e.preventDefault();
              if (!floatId || !description || !amount) return;
              recordPettyCashTransaction({ floatId, description, amount, category });
              push("Petty cash transaction recorded");
              setDescription("");
              setAmount(0);
            }}
          >
            <div className="flex-1 min-w-[160px]">
              <FormField label="Float" htmlFor="floatId">
                <Select id="floatId" value={floatId} onChange={(e) => setFloatId(e.target.value)}>
                  {activeFloats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.projectName}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="flex-1 min-w-[160px]">
              <FormField label="Description" htmlFor="description" required>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </FormField>
            </div>
            <div className="flex-1 min-w-[120px]">
              <FormField label="Amount" htmlFor="amount" required>
                <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} required />
              </FormField>
            </div>
            <div className="flex-1 min-w-[140px]">
              <FormField label="Category" htmlFor="category">
                <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <Button type="submit">Record Transaction</Button>
          </form>
        )}

        {pettyCashTransactions.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions yet" description="Disbursements recorded against a float will show here." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {pettyCashTransactions.map((t) => (
                <tr key={t.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{t.description}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{t.category}</td>
                  <td className="px-4 py-2.5 font-medium text-text-primary">{t.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
