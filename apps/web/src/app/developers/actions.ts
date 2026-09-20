"use server";

import { randomBytes, createHash } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { requireDeveloper } from "@/lib/developer-session";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { TOKENS_PER_USD } from "@/services/developers";

export interface DevActionState {
  error?: string;
  success?: string;
  /** Returned once on key creation — never stored or shown again. */
  newKey?: string;
  /** Pending top-up transaction id, for the payment handoff. */
  topupId?: string;
}

export const initialDevActionState: DevActionState = {};

// ---------------------------------------------------------------------------
// Onboarding — create the developer profile.
// ---------------------------------------------------------------------------
export async function createDeveloperProfile(
  _prev: DevActionState,
  formData: FormData
): Promise<DevActionState> {
  const { supabase, user } = await requireUser();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!displayName) return { error: "Display name is required." };

  const { error } = await supabase.from("developers").insert({
    user_id: user.id,
    display_name: displayName,
    company_name: companyName || null,
    email: user.email ?? "",
  });
  if (error) return { error: error.message };

  // Empty wallet row so balance reads never null.
  const { data: dev } = await supabase.from("developers").select("id").eq("user_id", user.id).single();
  if (dev) {
    await supabase.from("developer_wallets").insert({ developer_id: dev.id }).select().maybeSingle();
  }
  redirect("/developers");
}

// ---------------------------------------------------------------------------
// API keys — plaintext shown once; only the SHA-256 hash is stored.
// ---------------------------------------------------------------------------
export async function createApiKey(_prev: DevActionState, formData: FormData): Promise<DevActionState> {
  const { supabase, developer } = await requireDeveloper();
  const name = String(formData.get("name") ?? "").trim();
  const scope = String(formData.get("scope") ?? "public");
  if (!name) return { error: "Key name is required." };
  if (scope !== "public" && scope !== "private") return { error: "Invalid scope." };

  // Private keys need an org binding — the developer's own org, if they have
  // one (a developer who is also an org member gets B2B access to that org).
  let orgId: string | null = null;
  if (scope === "private") {
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (!membership) {
      return { error: "Private keys require an organization. Only public keys are available to you." };
    }
    orgId = membership.org_id;
  }

  const plaintext = `qb_${scope === "private" ? "sk" : "pk"}_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(plaintext).digest("hex");
  const prefix = plaintext.slice(0, 14);

  const { error } = await supabase.from("api_keys").insert({
    developer_id: developer.id,
    org_id: orgId,
    name,
    key_prefix: prefix,
    key_hash: keyHash,
    scope,
  });
  if (error) return { error: error.message };

  revalidatePath("/developers/keys");
  return { success: "API key created. Copy it now — it won't be shown again.", newKey: plaintext };
}

export async function revokeApiKey(keyId: string): Promise<void> {
  const { supabase } = await requireDeveloper();
  await supabase.from("api_keys").update({ status: "revoked" }).eq("id", keyId);
  revalidatePath("/developers/keys");
}

// ---------------------------------------------------------------------------
// Wallet top-up — creates a pending transaction, then hands off to the
// payment provider. Paynow handles card+bank; EcoCash is Paynow's mobile
// money rail. Without merchant credentials configured we return the pending
// transaction so the UI can show instructions / simulate in dev.
// ---------------------------------------------------------------------------
export async function initiateTopup(_prev: DevActionState, formData: FormData): Promise<DevActionState> {
  const { supabase, developer } = await requireDeveloper();
  const amountUsd = Number(formData.get("amountUsd"));
  const method = String(formData.get("method") ?? "paynow");
  if (!Number.isFinite(amountUsd) || amountUsd < 1) return { error: "Minimum top-up is $1." };
  if (method !== "paynow" && method !== "ecocash") return { error: "Unsupported method." };

  const tokens = Math.floor(amountUsd * TOKENS_PER_USD);
  const { data, error } = await supabase
    .from("wallet_transactions")
    .insert({
      developer_id: developer.id,
      type: "topup",
      amount_usd: amountUsd,
      tokens,
      method,
      status: "pending",
      reference: `TOPUP-${randomBytes(4).toString("hex").toUpperCase()}`,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // TODO: when Paynow merchant credentials are configured
  // (PAYNOW_INTEGRATION_ID / PAYNOW_INTEGRATION_KEY env vars), initiate the
  // real payment here and redirect to Paynow's payment URL. Until then the
  // transaction stays pending and can be completed via completeTopup.
  revalidatePath("/developers/wallet");
  return { success: `Top-up of $${amountUsd.toFixed(2)} (${tokens.toLocaleString()} tokens) initiated.`, topupId: data.id };
}

// Completes a pending top-up. In production this is called by the Paynow
// webhook after payment confirmation; exposed as an action for dev/testing.
export async function completeTopup(transactionId: string): Promise<void> {
  const { developer } = await requireDeveloper();
  const service = createServiceRoleClient();
  const rpc = service.rpc as unknown as (n: string, p: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  await rpc("credit_wallet_topup", { p_transaction_id: transactionId });
  revalidatePath("/developers/wallet");
  revalidatePath("/developers");
}

// ---------------------------------------------------------------------------
// Module submissions.
// ---------------------------------------------------------------------------
export async function submitModule(_prev: DevActionState, formData: FormData): Promise<DevActionState> {
  const { supabase, developer } = await requireDeveloper();
  const name = String(formData.get("name") ?? "").trim();
  const moduleKey = String(formData.get("moduleKey") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "other").trim();
  const version = String(formData.get("version") ?? "1.0.0").trim();
  const monthlyPriceUsd = Number(formData.get("monthlyPriceUsd") ?? 0);
  const entryUrl = String(formData.get("entryUrl") ?? "").trim();

  if (!name || !moduleKey || !description) return { error: "Name, module key, and description are required." };
  if (monthlyPriceUsd < 0) return { error: "Price can't be negative." };

  const manifest = { entry_url: entryUrl || null };

  const { error } = await supabase.from("module_submissions").insert({
    developer_id: developer.id,
    module_key: moduleKey,
    name,
    description,
    category,
    version,
    monthly_price_usd: monthlyPriceUsd,
    manifest,
    status: "pending_review",
    submitted_at: new Date().toISOString(),
  });
  if (error) {
    if (error.message.includes("unique")) return { error: `You already have a module with key "${moduleKey}".` };
    return { error: error.message };
  }

  revalidatePath("/developers/modules");
  return { success: "Module submitted for review. We'll notify you of the decision." };
}

export async function withdrawSubmission(submissionId: string): Promise<void> {
  const { supabase } = await requireDeveloper();
  await supabase
    .from("module_submissions")
    .update({ status: "deleted" })
    .eq("id", submissionId)
    .in("status", ["draft", "pending_review", "rejected"]);
  revalidatePath("/developers/modules");
}

// ---------------------------------------------------------------------------
// Support tickets.
// ---------------------------------------------------------------------------
export async function createSupportTicket(_prev: DevActionState, formData: FormData): Promise<DevActionState> {
  const { supabase, developer } = await requireDeveloper();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!subject || !body) return { error: "Subject and message are required." };

  const { error } = await supabase.from("developer_support_tickets").insert({
    developer_id: developer.id,
    subject,
    body,
  });
  if (error) return { error: error.message };
  revalidatePath("/developers/support");
  return { success: "Ticket submitted. We'll respond by email and here." };
}
