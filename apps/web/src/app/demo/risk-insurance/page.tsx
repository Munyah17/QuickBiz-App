"use client";

import { useState } from "react";
import { Plus, Building2, ShieldAlert, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { Input, Select, Textarea } from "@/components/Input";
import { FormField } from "@/components/FormField";
import {
  useDemo,
  type DemoInsurancePolicy,
  type DemoInsuranceClaim,
  type DemoRiskAssessment,
} from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const POLICY_STATUS_TONE: Record<DemoInsurancePolicy["status"], "neutral" | "success" | "warning" | "danger"> = {
  active: "success",
  expired: "danger",
  cancelled: "danger",
  pending_renewal: "warning",
};

const CLAIM_STATUS_TONE: Record<DemoInsuranceClaim["status"], "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  submitted: "neutral",
  under_review: "warning",
  approved: "success",
  rejected: "danger",
  paid: "success",
  closed: "neutral",
};

const RISK_LEVEL_TONE: Record<DemoRiskAssessment["riskLevel"], "neutral" | "success" | "warning" | "danger"> = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

const RISK_STATUS_TONE: Record<DemoRiskAssessment["status"], "neutral" | "success" | "warning" | "danger"> = {
  open: "warning",
  mitigating: "warning",
  mitigated: "success",
  accepted: "neutral",
  closed: "neutral",
};

function NewInsurerModal({ onClose }: { onClose: () => void }) {
  const { addInsurer } = useDemo();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <Modal open onClose={onClose} title="Add Insurer">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          addInsurer({ name: name.trim(), code: code.trim(), contactPerson: contactPerson.trim(), email: email.trim(), phone: phone.trim() });
          push("Insurer added");
          onClose();
        }}
      >
        <FormField label="Name" htmlFor="name">
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Code" htmlFor="code">
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />
        </FormField>
        <FormField label="Contact Person" htmlFor="contactPerson">
          <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
        </FormField>
        <FormField label="Email" htmlFor="email">
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Phone" htmlFor="phone">
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add Insurer</Button>
        </div>
      </form>
    </Modal>
  );
}

const POLICY_TYPES = ["property", "liability", "workers_comp", "vehicle", "health", "life", "business_interruption", "cyber", "other"];

function NewPolicyModal({ insurerNames, onClose }: { insurerNames: string[]; onClose: () => void }) {
  const { createInsurancePolicy } = useDemo();
  const { push } = useToast();
  const [insurerName, setInsurerName] = useState(insurerNames[0] ?? "");
  const [policyNumber, setPolicyNumber] = useState("");
  const [policyType, setPolicyType] = useState(POLICY_TYPES[0]!);
  const [coverageType, setCoverageType] = useState("");
  const [sumInsured, setSumInsured] = useState("");
  const [premium, setPremium] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <Modal open onClose={onClose} title="New Insurance Policy">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createInsurancePolicy({
            insurerName,
            policyNumber: policyNumber.trim(),
            policyType,
            coverageType: coverageType.trim(),
            sumInsured: Number(sumInsured) || 0,
            premium: Number(premium) || 0,
            endDate: new Date(endDate).toISOString(),
          });
          push("Policy created");
          onClose();
        }}
      >
        <FormField label="Insurer" htmlFor="insurerName">
          <Select id="insurerName" value={insurerName} onChange={(e) => setInsurerName(e.target.value)} required>
            {insurerNames.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Policy Number" htmlFor="policyNumber">
          <Input id="policyNumber" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} required />
        </FormField>
        <FormField label="Policy Type" htmlFor="policyType">
          <Select id="policyType" value={policyType} onChange={(e) => setPolicyType(e.target.value)}>
            {POLICY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Coverage Type" htmlFor="coverageType">
          <Input id="coverageType" value={coverageType} onChange={(e) => setCoverageType(e.target.value)} />
        </FormField>
        <FormField label="Sum Insured" htmlFor="sumInsured">
          <Input id="sumInsured" type="number" step="0.01" min={0} value={sumInsured} onChange={(e) => setSumInsured(e.target.value)} />
        </FormField>
        <FormField label="Premium" htmlFor="premium">
          <Input id="premium" type="number" step="0.01" min={0} value={premium} onChange={(e) => setPremium(e.target.value)} required />
        </FormField>
        <FormField label="End Date" htmlFor="endDate">
          <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Policy</Button>
        </div>
      </form>
    </Modal>
  );
}

function SubmitClaimModal({ policyId, onClose }: { policyId: string; onClose: () => void }) {
  const { submitInsuranceClaim } = useDemo();
  const { push } = useToast();
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("");

  return (
    <Modal open onClose={onClose} title="Submit Claim">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submitInsuranceClaim(policyId, new Date(incidentDate).toISOString(), incidentDescription.trim(), Number(claimAmount) || 0);
          push("Claim submitted");
          onClose();
        }}
      >
        <FormField label="Incident Date" htmlFor="incidentDate">
          <Input id="incidentDate" type="date" value={incidentDate} onChange={(e) => setIncidentDate(e.target.value)} required />
        </FormField>
        <FormField label="Incident Description" htmlFor="incidentDescription">
          <Textarea id="incidentDescription" value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} required />
        </FormField>
        <FormField label="Claim Amount" htmlFor="claimAmount">
          <Input id="claimAmount" type="number" step="0.01" min={0} value={claimAmount} onChange={(e) => setClaimAmount(e.target.value)} required />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit Claim</Button>
        </div>
      </form>
    </Modal>
  );
}

function ClaimsModal({ policy, onClose }: { policy: DemoInsurancePolicy; onClose: () => void }) {
  const { insuranceClaims } = useDemo();
  const [submitClaimOpen, setSubmitClaimOpen] = useState(false);
  const claims = insuranceClaims.filter((c) => c.policyId === policy.id);

  return (
    <Modal open onClose={onClose} title={`Claims for ${policy.policyNumber}`}>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setSubmitClaimOpen(true)}>
            Submit Claim
          </Button>
        </div>

        {claims.length === 0 ? (
          <p className="text-sm text-text-tertiary">No claims submitted yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-2 py-2">Claim</th>
                <th className="px-2 py-2">Incident</th>
                <th className="px-2 py-2">Amount</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((c) => (
                <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-2 py-2 font-medium text-text-primary">{c.claimNumber}</td>
                  <td className="px-2 py-2 text-text-secondary">{new Date(c.incidentDate).toLocaleDateString()}</td>
                  <td className="px-2 py-2 text-text-secondary">{c.claimAmount.toFixed(2)}</td>
                  <td className="px-2 py-2">
                    <Badge tone={CLAIM_STATUS_TONE[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {submitClaimOpen && <SubmitClaimModal policyId={policy.id} onClose={() => setSubmitClaimOpen(false)} />}
    </Modal>
  );
}

const RISK_CATEGORIES = ["operational", "financial", "compliance", "strategic", "reputational", "health_safety", "other"];

function NewRiskAssessmentModal({ onClose }: { onClose: () => void }) {
  const { createRiskAssessment } = useDemo();
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(RISK_CATEGORIES[0]!);
  const [likelihood, setLikelihood] = useState("3");
  const [impact, setImpact] = useState("3");
  const [reviewDate, setReviewDate] = useState("");

  return (
    <Modal open onClose={onClose} title="New Risk Assessment">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          createRiskAssessment({
            title: title.trim(),
            category,
            likelihood: Number(likelihood) || 1,
            impact: Number(impact) || 1,
            reviewDate: reviewDate ? new Date(reviewDate).toISOString() : "",
          });
          push("Risk assessment created");
          onClose();
        }}
      >
        <FormField label="Title" htmlFor="title">
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </FormField>
        <FormField label="Category" htmlFor="category">
          <Select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {RISK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Likelihood (1-5)" htmlFor="likelihood">
          <Input id="likelihood" type="number" step="0.5" min={1} max={5} value={likelihood} onChange={(e) => setLikelihood(e.target.value)} required />
        </FormField>
        <FormField label="Impact (1-5)" htmlFor="impact">
          <Input id="impact" type="number" step="0.5" min={1} max={5} value={impact} onChange={(e) => setImpact(e.target.value)} required />
        </FormField>
        <FormField label="Review Date" htmlFor="reviewDate">
          <Input id="reviewDate" type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Create Assessment</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DemoRiskInsurancePage() {
  const { insurers, insurancePolicies, riskAssessments } = useDemo();
  const [newInsurerOpen, setNewInsurerOpen] = useState(false);
  const [newPolicyOpen, setNewPolicyOpen] = useState(false);
  const [newRiskOpen, setNewRiskOpen] = useState(false);
  const [viewPolicy, setViewPolicy] = useState<DemoInsurancePolicy | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Operations" title="Risk & Insurance" />

      <p className="text-sm text-text-tertiary">
        Onboard insurers, track insurance policies covering your assets and operations, process claims, and
        maintain a risk register with mitigation plans.
      </p>

      <Card>
        <CardHeader
          title="Insurers"
          action={
            <Button variant="secondary" onClick={() => setNewInsurerOpen(true)}>
              <Plus className="size-4" />
              Add Insurer
            </Button>
          }
        />
        {insurers.length === 0 ? (
          <EmptyState icon={Building2} title="No insurers yet" description="Add an insurer before creating policies." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Code</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Phone</th>
              </tr>
            </thead>
            <tbody>
              {insurers.map((i) => (
                <tr key={i.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{i.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.code}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.contactPerson || "-"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.email || "-"}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{i.phone || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Insurance Policies"
          action={
            <Button onClick={() => setNewPolicyOpen(true)} disabled={insurers.length === 0}>
              <Plus className="size-4" />
              New Policy
            </Button>
          }
        />
        {insurancePolicies.length === 0 ? (
          <EmptyState icon={ShieldAlert} title="No policies yet" description="Create a policy to cover an asset, vehicle, or operation." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Policy</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Insurer</th>
                <th className="px-4 py-2.5">Premium</th>
                <th className="px-4 py-2.5">End Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {insurancePolicies.map((p) => (
                <tr key={p.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{p.policyNumber}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.policyType.replace("_", " ")}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.insurerName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{p.premium.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={POLICY_STATUS_TONE[p.status]}>{p.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Button variant="secondary" size="sm" onClick={() => setViewPolicy(p)}>
                      View Claims
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Risk Register"
          action={
            <Button onClick={() => setNewRiskOpen(true)}>
              <Plus className="size-4" />
              New Risk Assessment
            </Button>
          }
        />
        {riskAssessments.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No risks assessed yet" description="Record a risk assessment to start tracking mitigation." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Title</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Risk Level</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Review Date</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {riskAssessments.map((r) => (
                <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{r.title}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.category.replace("_", " ")}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={RISK_LEVEL_TONE[r.riskLevel]}>{r.riskLevel}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.riskScore}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(r.reviewDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={RISK_STATUS_TONE[r.status]}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {newInsurerOpen && <NewInsurerModal onClose={() => setNewInsurerOpen(false)} />}
      {newPolicyOpen && <NewPolicyModal insurerNames={insurers.map((i) => i.name)} onClose={() => setNewPolicyOpen(false)} />}
      {newRiskOpen && <NewRiskAssessmentModal onClose={() => setNewRiskOpen(false)} />}
      {viewPolicy && <ClaimsModal policy={viewPolicy} onClose={() => setViewPolicy(null)} />}
    </div>
  );
}
