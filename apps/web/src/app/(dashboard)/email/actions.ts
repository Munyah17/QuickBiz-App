"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getEmailSettings, updateEmailSettings } from "@/services/email";

export interface EmailActionState {
  error: string | null;
  success: boolean;
}

export const initialEmailActionState: EmailActionState = { error: null, success: false };

export async function updateEmailSettingsAction(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "email");

  if (!permissions.has("email.manage")) {
    return { error: "You don't have permission to manage email settings.", success: false };
  }

  const provider = String(formData.get("provider") ?? "smtp");
  const smtpHost = String(formData.get("smtpHost") ?? "").trim();
  const smtpPortRaw = String(formData.get("smtpPort") ?? "").trim();
  const smtpUsername = String(formData.get("smtpUsername") ?? "").trim();
  const smtpPassword = String(formData.get("smtpPassword") ?? "");
  const fromEmail = String(formData.get("fromEmail") ?? "").trim();
  const fromName = String(formData.get("fromName") ?? "").trim();
  const replyToEmail = String(formData.get("replyToEmail") ?? "").trim();

  if (!fromEmail || !fromName) {
    return { error: "From address and from name are required.", success: false };
  }

  try {
    await updateEmailSettings(supabase, orgId, {
      provider,
      smtpHost,
      smtpPort: smtpPortRaw ? Number(smtpPortRaw) : null,
      smtpUsername,
      smtpPassword,
      fromEmail,
      fromName,
      replyToEmail,
    });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/email");
  return { error: null, success: true };
}

// There is no SMTP send wired up yet, and email_logs has no insert policy
// for this role (it's read-only for org members - writes are reserved for
// a future sending worker). This only confirms settings are usable; it
// deliberately does not claim to send or log anything.
export async function sendTestEmailAction(_prev: EmailActionState, formData: FormData): Promise<EmailActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "email");

  if (!permissions.has("email.send")) {
    return { error: "You don't have permission to send email.", success: false };
  }

  const to = String(formData.get("to") ?? "").trim();
  if (!to) {
    return { error: "Recipient address is required.", success: false };
  }

  const settings = await getEmailSettings(supabase, orgId);
  if (!settings || !settings.isConfigured) {
    return { error: "Configure your SMTP settings before sending a test email.", success: false };
  }

  return { error: null, success: true };
}
