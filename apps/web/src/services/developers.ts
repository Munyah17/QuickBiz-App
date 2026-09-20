import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export const TOKENS_PER_USD = 1000;
export const MODULE_HOSTING_FEE_USD = 5;
export const PLATFORM_REVENUE_SHARE = 0.3;

export interface DeveloperProfile {
  id: string;
  displayName: string;
  companyName: string | null;
  email: string;
  status: "active" | "suspended";
  createdAt: string;
}

export async function getDeveloperByUser(supabase: SupabaseClient, userId: string): Promise<DeveloperProfile | null> {
  const { data, error } = await supabase
    .from("developers")
    .select("id, display_name, company_name, email, status, created_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name,
    companyName: data.company_name,
    email: data.email,
    status: data.status as DeveloperProfile["status"],
    createdAt: data.created_at,
  };
}

export interface WalletSummary {
  tokenBalance: number;
  lifetimePurchased: number;
  lifetimeUsed: number;
  lastTopupTokens: number;
}

export async function getWallet(supabase: SupabaseClient, developerId: string): Promise<WalletSummary> {
  const { data, error } = await supabase
    .from("developer_wallets")
    .select("token_balance, lifetime_tokens_purchased, lifetime_tokens_used, last_topup_tokens")
    .eq("developer_id", developerId)
    .maybeSingle();
  if (error) throw error;
  return {
    tokenBalance: Number(data?.token_balance ?? 0),
    lifetimePurchased: Number(data?.lifetime_tokens_purchased ?? 0),
    lifetimeUsed: Number(data?.lifetime_tokens_used ?? 0),
    lastTopupTokens: Number(data?.last_topup_tokens ?? 0),
  };
}

export interface ApiKeyRow {
  id: string;
  name: string;
  prefix: string;
  scope: "public" | "private";
  status: "active" | "revoked";
  lastUsedAt: string | null;
  createdAt: string;
}

export async function listApiKeys(supabase: SupabaseClient, developerId: string): Promise<ApiKeyRow[]> {
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scope, status, last_used_at, created_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.key_prefix,
    scope: k.scope as ApiKeyRow["scope"],
    status: k.status as ApiKeyRow["status"],
    lastUsedAt: k.last_used_at,
    createdAt: k.created_at,
  }));
}

export interface UsageRow {
  id: number;
  endpoint: string;
  method: string;
  tokensUsed: number;
  statusCode: number;
  createdAt: string;
}

export async function listUsage(supabase: SupabaseClient, developerId: string, limit = 100): Promise<UsageRow[]> {
  const { data, error } = await supabase
    .from("api_usage")
    .select("id, endpoint, method, tokens_used, status_code, created_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((u) => ({
    id: Number(u.id),
    endpoint: u.endpoint,
    method: u.method,
    tokensUsed: u.tokens_used,
    statusCode: u.status_code,
    createdAt: u.created_at,
  }));
}

export interface WalletTxRow {
  id: string;
  type: "topup" | "debit" | "hosting_fee" | "refund";
  amountUsd: number;
  tokens: number;
  method: string | null;
  status: "pending" | "completed" | "failed";
  reference: string | null;
  createdAt: string;
}

export async function listWalletTransactions(
  supabase: SupabaseClient,
  developerId: string,
  limit = 50
): Promise<WalletTxRow[]> {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount_usd, tokens, method, status, reference, created_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    type: t.type as WalletTxRow["type"],
    amountUsd: t.amount_usd,
    tokens: Number(t.tokens),
    method: t.method,
    status: t.status as WalletTxRow["status"],
    reference: t.reference,
    createdAt: t.created_at,
  }));
}

export interface ModuleSubmissionRow {
  id: string;
  moduleKey: string;
  name: string;
  description: string;
  category: string;
  version: string;
  monthlyPriceUsd: number;
  status: "draft" | "pending_review" | "approved" | "rejected" | "suspended" | "deleted";
  reviewNotes: string | null;
  submittedAt: string | null;
  createdAt: string;
  activeLicenses?: number;
}

export async function listSubmissions(supabase: SupabaseClient, developerId: string): Promise<ModuleSubmissionRow[]> {
  const { data, error } = await supabase
    .from("module_submissions")
    .select("id, module_key, name, description, category, version, monthly_price_usd, status, review_notes, submitted_at, created_at, module_licenses(id)")
    .eq("developer_id", developerId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    moduleKey: s.module_key,
    name: s.name,
    description: s.description,
    category: s.category,
    version: s.version,
    monthlyPriceUsd: s.monthly_price_usd,
    status: s.status as ModuleSubmissionRow["status"],
    reviewNotes: s.review_notes,
    submittedAt: s.submitted_at,
    createdAt: s.created_at,
    activeLicenses: ((s.module_licenses as unknown as Array<{ id: string }>) ?? []).length,
  }));
}

export interface DevNotificationRow {
  id: string;
  title: string;
  body: string | null;
  type: "info" | "success" | "warning" | "error";
  readAt: string | null;
  createdAt: string;
}

export async function listDeveloperNotifications(
  supabase: SupabaseClient,
  developerId: string,
  limit = 20
): Promise<DevNotificationRow[]> {
  const { data, error } = await supabase
    .from("developer_notifications")
    .select("id, title, body, type, read_at, created_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type as DevNotificationRow["type"],
    readAt: n.read_at,
    createdAt: n.created_at,
  }));
}

export interface SupportTicketRow {
  id: string;
  subject: string;
  body: string;
  status: "open" | "answered" | "closed";
  createdAt: string;
}

export async function listSupportTickets(supabase: SupabaseClient, developerId: string): Promise<SupportTicketRow[]> {
  const { data, error } = await supabase
    .from("developer_support_tickets")
    .select("id, subject, body, status, created_at")
    .eq("developer_id", developerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    subject: t.subject,
    body: t.body,
    status: t.status as SupportTicketRow["status"],
    createdAt: t.created_at,
  }));
}

export interface PayoutRow {
  id: string;
  period: string;
  grossUsd: number;
  platformShareUsd: number;
  netUsd: number;
  status: "pending" | "paid" | "failed";
  createdAt: string;
}

export async function listPayouts(supabase: SupabaseClient, developerId: string): Promise<PayoutRow[]> {
  const { data, error } = await supabase
    .from("developer_payouts")
    .select("id, period, gross_usd, platform_share_usd, net_usd, status, created_at")
    .eq("developer_id", developerId)
    .order("period", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    period: p.period,
    grossUsd: p.gross_usd,
    platformShareUsd: p.platform_share_usd,
    netUsd: p.net_usd,
    status: p.status as PayoutRow["status"],
    createdAt: p.created_at,
  }));
}
