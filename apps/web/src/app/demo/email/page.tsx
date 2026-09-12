"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { EmptyState } from "@/components/EmptyState";
import { useDemo, type DemoEmailLogEntry } from "@/lib/demo/DemoContext";
import { useToast } from "@/components/Toast";

const PROVIDERS = ["smtp", "sendgrid", "mailgun", "ses", "postmark", "custom"];

const STATUS_TONE: Record<DemoEmailLogEntry["status"], "neutral" | "success" | "warning" | "danger" | "info"> = {
  sent: "success",
  failed: "danger",
};

export default function DemoEmailPage() {
  const { emailSettings, emailLogs, updateEmailSettings, sendTestEmail } = useDemo();
  const { push } = useToast();

  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [fromName, setFromName] = useState(emailSettings.fromName);
  const [fromAddress, setFromAddress] = useState(emailSettings.fromAddress);
  const [smtpHost, setSmtpHost] = useState(emailSettings.smtpHost);
  const [smtpPort, setSmtpPort] = useState(emailSettings.smtpPort);
  const [smtpPassword, setSmtpPassword] = useState("");
  const [testTo, setTestTo] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Platform" title="Email" />

      <p className="text-sm text-text-tertiary">
        Configure your own SMTP provider to send invoices, receipts, and notifications from your organization&apos;s
        own address. Your credentials are never displayed back once saved.
      </p>

      <Card>
        <CardHeader title="SMTP Settings" action={<Badge tone={emailSettings.isConfigured ? "success" : "neutral"}>{emailSettings.isConfigured ? "Configured" : "Not configured"}</Badge>} />
        <form
          className="flex flex-col gap-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateEmailSettings({ fromAddress, fromName, smtpHost, smtpPort });
            setSmtpPassword("");
            push("Email settings saved");
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Provider" htmlFor="provider">
              <Select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}>
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="From Name" htmlFor="fromName" required>
              <Input id="fromName" value={fromName} onChange={(e) => setFromName(e.target.value)} required />
            </FormField>

            <FormField label="From Address" htmlFor="fromAddress" required>
              <Input id="fromAddress" type="email" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} required />
            </FormField>

            <FormField label="SMTP Host" htmlFor="smtpHost">
              <Input id="smtpHost" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.yourprovider.com" />
            </FormField>

            <FormField label="SMTP Port" htmlFor="smtpPort">
              <Input id="smtpPort" type="number" value={smtpPort} onChange={(e) => setSmtpPort(Number(e.target.value))} placeholder="587" />
            </FormField>

            <FormField label="SMTP Password" htmlFor="smtpPassword" hint={emailSettings.isConfigured ? "Leave blank to keep the currently saved password." : undefined}>
              <Input
                id="smtpPassword"
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder={emailSettings.isConfigured ? "••••••••" : ""}
                autoComplete="new-password"
              />
            </FormField>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Save Settings</Button>
          </div>
        </form>

        <form
          className="flex flex-col gap-3 border-t border-border-subtle p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            sendTestEmail(testTo);
            push("Recorded test send - actual SMTP delivery isn't wired up yet");
            setTestTo("");
          }}
        >
          <div className="flex-1">
            <FormField label="Send Test Email To" htmlFor="testTo">
              <Input id="testTo" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" required />
            </FormField>
          </div>
          <Button type="submit" variant="secondary">
            <Send className="size-4" />
            Send Test Email
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Email Log" />
        {emailLogs.length === 0 ? (
          <EmptyState icon={Mail} title="No emails sent yet" description="Emails sent from other parts of the system will be logged here." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">To</th>
                <th className="px-4 py-2.5">Subject</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Sent</th>
              </tr>
            </thead>
            <tbody>
              {emailLogs.map((l) => (
                <tr key={l.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{l.to}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{l.subject}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[l.status]}>{l.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{new Date(l.sentAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
