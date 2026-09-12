import type { TypedSupabaseClient as SupabaseClient } from "@quickbiz/supabase/types";

export interface ConnectedSocialAccountRow {
  id: string;
  platformKey: string;
  accountName: string;
  isActive: boolean;
  createdAt: string;
}

export async function listConnectedSocialAccounts(supabase: SupabaseClient, orgId: string): Promise<ConnectedSocialAccountRow[]> {
  const { data, error } = await supabase.rpc("list_connected_social_accounts", { p_org_id: orgId });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      platform_key: string;
      account_name: string;
      is_active: boolean;
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    platformKey: row.platform_key,
    accountName: row.account_name,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

export interface ConnectSocialAccountInput {
  platformKey: string;
  accountId: string;
  accountName: string;
}

export async function connectSocialAccount(supabase: SupabaseClient, orgId: string, input: ConnectSocialAccountInput) {
  const { error } = await supabase.rpc("connect_social_account", {
    p_org_id: orgId,
    p_platform_key: input.platformKey,
    p_account_id: input.accountId,
    p_account_name: input.accountName,
    p_access_token_encrypted: "demo-placeholder-token",
  });
  if (error) throw error;
}

export async function disconnectSocialAccount(supabase: SupabaseClient, orgId: string, accountId: string) {
  const { error } = await supabase.rpc("disconnect_social_account", { p_org_id: orgId, p_account_id: accountId });
  if (error) throw error;
}

export interface SocialPostRow {
  id: string;
  title: string;
  status: "draft" | "scheduled" | "queued" | "published" | "failed";
  scheduledFor: string | null;
  platforms: string[];
  createdAt: string;
}

export async function listSocialPosts(supabase: SupabaseClient, orgId: string): Promise<SocialPostRow[]> {
  const { data, error } = await supabase.rpc("list_social_posts", { p_org_id: orgId });
  if (error) throw error;

  return (
    data as unknown as Array<{
      id: string;
      title: string;
      status: "draft" | "scheduled" | "queued" | "published" | "failed";
      scheduled_for: string | null;
      platforms: string[];
      created_at: string;
    }>
  ).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    scheduledFor: row.scheduled_for,
    platforms: row.platforms,
    createdAt: row.created_at,
  }));
}

export interface CreateSocialPostInput {
  title: string;
  content: string;
  platforms: string[];
}

export async function createSocialPost(supabase: SupabaseClient, orgId: string, input: CreateSocialPostInput): Promise<string> {
  const { data, error } = await supabase.rpc("create_social_post", {
    p_org_id: orgId,
    p_title: input.title,
    p_content: input.content,
    p_platforms: JSON.stringify(input.platforms),
  });
  if (error) throw error;
  return data as unknown as string;
}

export async function queueSocialPostForPublishing(supabase: SupabaseClient, postId: string) {
  const { error } = await supabase.rpc("queue_social_post_for_publishing", { p_post_id: postId });
  if (error) throw error;
}
