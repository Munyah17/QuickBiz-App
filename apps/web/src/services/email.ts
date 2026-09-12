import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface EmailSettingsRow {
  id: string;
  provider: string;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUsername: string | null;
  fromEmail: string;
  fromName: string;
  replyToEmail: string | null;
  isActive: boolean;
  isConfigured: boolean;
}

// smtp_password_encrypted is never selected here - email_settings is
// write-only for its secret from the UI's perspective (same pattern as
// org_integration_connections in services/integrations.ts). RLS also
// restricts SELECT on this table to email.manage.
export async function getEmailSettings(supabase: SupabaseClient, orgId: string): Promise<EmailSettingsRow | null> {
  const { data, error } = await supabase
    .from("email_settings")
    .select("id, provider, smtp_host, smtp_port, smtp_username, from_email, from_name, reply_to_email, is_active")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    provider: data.provider,
    smtpHost: data.smtp_host,
    smtpPort: data.smtp_port,
    smtpUsername: data.smtp_username,
    fromEmail: data.from_email,
    fromName: data.from_name,
    replyToEmail: data.reply_to_email,
    isActive: data.is_active,
    isConfigured: !!data.smtp_host,
  };
}

export interface UpdateEmailSettingsInput {
  provider: string;
  smtpHost: string;
  smtpPort: number | null;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
}

// smtpPassword is only written when the caller actually typed something -
// an empty field never clears or overwrites the stored secret, and it is
// never read back into the payload from a prior fetch.
export async function updateEmailSettings(supabase: SupabaseClient, orgId: string, input: UpdateEmailSettingsInput): Promise<void> {
  const existing = await supabase.from("email_settings").select("id").eq("org_id", orgId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing.error) throw existing.error;

  const payload: Record<string, unknown> = {
    provider: input.provider,
    smtp_host: input.smtpHost || null,
    smtp_port: input.smtpPort,
    smtp_username: input.smtpUsername || null,
    from_email: input.fromEmail,
    from_name: input.fromName,
    reply_to_email: input.replyToEmail || null,
  };
  if (input.smtpPassword) {
    payload.smtp_password_encrypted = input.smtpPassword;
  }

  if (existing.data) {
    const { error } = await supabase.from("email_settings").update(payload).eq("id", existing.data.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("email_settings").insert({ org_id: orgId, ...payload });
    if (error) throw error;
  }
}

export interface EmailLogRow {
  id: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  status: "queued" | "sent" | "delivered" | "opened" | "clicked" | "bounced" | "failed";
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export async function listEmailLogs(supabase: SupabaseClient, orgId: string, limit = 50): Promise<EmailLogRow[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("id, to_email, to_name, subject, status, sent_at, error_message, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      to_email: string;
      to_name: string | null;
      subject: string;
      status: EmailLogRow["status"];
      sent_at: string | null;
      error_message: string | null;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    toEmail: row.to_email,
    toName: row.to_name,
    subject: row.subject,
    status: row.status,
    sentAt: row.sent_at,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }));
}
