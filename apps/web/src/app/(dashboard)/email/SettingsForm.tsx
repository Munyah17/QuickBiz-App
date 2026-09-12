"use client";

import { useActionState, useEffect, useState } from "react";
import { Send } from "lucide-react";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { FormField } from "@/components/FormField";
import { useToast } from "@/components/Toast";
import { updateEmailSettingsAction, sendTestEmailAction, initialEmailActionState } from "./actions";
import type { EmailSettingsRow } from "@/services/email";

const PROVIDERS = ["smtp", "sendgrid", "mailgun", "ses", "postmark", "custom"];

export function SettingsForm({ settings, canSend }: { settings: EmailSettingsRow | null; canSend: boolean }) {
  const [saveState, saveAction, isSaving] = useActionState(updateEmailSettingsAction, initialEmailActionState);
  const [testState, testAction, isTesting] = useActionState(sendTestEmailAction, initialEmailActionState);
  const [testTo, setTestTo] = useState("");
  const { push } = useToast();

  useEffect(() => {
    if (saveState.success) push("Email settings saved");
    if (saveState.error) push(saveState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveState.success, saveState.error]);

  useEffect(() => {
    if (testState.success) push("Recorded test send - actual SMTP delivery isn't wired up yet");
    if (testState.error) push(testState.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testState.success, testState.error]);

  return (
    <Card>
      <CardHeader title="SMTP Settings" action={<Badge tone={settings?.isConfigured ? "success" : "neutral"}>{settings?.isConfigured ? "Configured" : "Not configured"}</Badge>} />
      <form action={saveAction} className="flex flex-col gap-4 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Provider" htmlFor="provider">
            <Select id="provider" name="provider" defaultValue={settings?.provider ?? "smtp"}>
              {PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="From Name" htmlFor="fromName" required>
            <Input id="fromName" name="fromName" defaultValue={settings?.fromName ?? ""} required />
          </FormField>

          <FormField label="From Address" htmlFor="fromEmail" required>
            <Input id="fromEmail" name="fromEmail" type="email" defaultValue={settings?.fromEmail ?? ""} required />
          </FormField>

          <FormField label="Reply-To Address" htmlFor="replyToEmail">
            <Input id="replyToEmail" name="replyToEmail" type="email" defaultValue={settings?.replyToEmail ?? ""} />
          </FormField>

          <FormField label="SMTP Host" htmlFor="smtpHost">
            <Input id="smtpHost" name="smtpHost" defaultValue={settings?.smtpHost ?? ""} placeholder="smtp.yourprovider.com" />
          </FormField>

          <FormField label="SMTP Port" htmlFor="smtpPort">
            <Input id="smtpPort" name="smtpPort" type="number" defaultValue={settings?.smtpPort ?? ""} placeholder="587" />
          </FormField>

          <FormField label="SMTP Username" htmlFor="smtpUsername">
            <Input id="smtpUsername" name="smtpUsername" defaultValue={settings?.smtpUsername ?? ""} />
          </FormField>

          <FormField label="SMTP Password" htmlFor="smtpPassword" hint={settings?.isConfigured ? "Leave blank to keep the currently saved password." : undefined}>
            <Input id="smtpPassword" name="smtpPassword" type="password" placeholder={settings?.isConfigured ? "••••••••" : ""} autoComplete="new-password" />
          </FormField>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={isSaving}>
            Save Settings
          </Button>
        </div>
      </form>

      {canSend && (
        <form action={testAction} className="flex flex-col gap-3 border-t border-border-subtle p-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormField label="Send Test Email To" htmlFor="testTo">
              <Input id="testTo" name="to" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" required />
            </FormField>
          </div>
          <Button type="submit" variant="secondary" loading={isTesting}>
            <Send className="size-4" />
            Send Test Email
          </Button>
        </form>
      )}
    </Card>
  );
}
