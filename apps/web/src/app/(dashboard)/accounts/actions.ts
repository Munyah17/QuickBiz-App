"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { createAccount, setAccountActive, seedDefaultAccounts, type Account } from "@/services/finance";

export interface AccountActionState {
  error: string | null;
  success: boolean;
}

export const initialAccountActionState: AccountActionState = { error: null, success: false };

// useActionState requires this exact (prevState, formData) signature even
// though this action takes no input of its own.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function seedDefaultAccountsAction(_prev: AccountActionState, _formData: FormData): Promise<AccountActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "finance");

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to manage accounts.", success: false };
  }

  try {
    await seedDefaultAccounts(supabase, orgId);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/accounts");
  return { error: null, success: true };
}

export async function createAccountAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to manage accounts.", success: false };
  }

  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as Account["type"];

  if (!code || !name) return { error: "Code and name are required.", success: false };

  try {
    await createAccount(supabase, orgId, { code, name, type });
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/accounts");
  return { error: null, success: true };
}

export async function setAccountActiveAction(_prev: AccountActionState, formData: FormData): Promise<AccountActionState> {
  const { supabase, permissions } = await requireOrgContext();

  if (!permissions.has("finance.manage")) {
    return { error: "You don't have permission to manage accounts.", success: false };
  }

  const accountId = String(formData.get("accountId") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  try {
    await setAccountActive(supabase, accountId, isActive);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/accounts");
  return { error: null, success: true };
}
