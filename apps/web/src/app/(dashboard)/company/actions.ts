"use server";

import { revalidatePath } from "next/cache";
import { requireOrgContext } from "@/lib/session";
import { updateOrganization, upsertOrgSetting, updateThemeColor } from "@/services/org";
import { HEX_PATTERN } from "@/lib/theme";

export interface CompanyActionState {
  error: string | null;
  success: boolean;
}

export const initialCompanyActionState: CompanyActionState = { error: null, success: false };

export async function updateCompanyAction(
  _prev: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("settings.manage")) {
    return { error: "You don't have permission to change company settings.", success: false };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Company name is required.", success: false };

  try {
    await updateOrganization(supabase, orgId, {
      name,
      legal_name: String(formData.get("legal_name") ?? "").trim() || undefined,
      currency: String(formData.get("currency") ?? "USD"),
      timezone: String(formData.get("timezone") ?? "Africa/Harare"),
    });

    await upsertOrgSetting(supabase, orgId, "contact.phone", String(formData.get("phone") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "contact.email", String(formData.get("email") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "contact.website", String(formData.get("website") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "contact.address", String(formData.get("address") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "branding.logo_url", String(formData.get("logo_url") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "branding.tax_number", String(formData.get("tax_number") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "branding.bank_details", String(formData.get("bank_details") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "branding.terms", String(formData.get("terms") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "tax.default_rate", String(formData.get("tax_rate") ?? "").trim());
    await upsertOrgSetting(supabase, orgId, "invoice.footer", String(formData.get("invoice_footer") ?? "").trim());
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  revalidatePath("/company");
  return { error: null, success: true };
}

export async function updateThemeColorAction(
  _prev: CompanyActionState,
  formData: FormData
): Promise<CompanyActionState> {
  const { supabase, orgId, permissions } = await requireOrgContext();

  if (!permissions.has("settings.manage")) {
    return { error: "You don't have permission to change the theme.", success: false };
  }

  const raw = String(formData.get("hexColor") ?? "").trim();
  // Empty submission resets to the default QuickBiz navy/blue theme.
  const hexColor = raw === "" ? null : raw;

  if (hexColor !== null && !HEX_PATTERN.test(hexColor)) {
    return { error: "Enter a valid 6-digit hex color, e.g. #2563EB.", success: false };
  }

  try {
    await updateThemeColor(supabase, orgId, hexColor);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  // Theme is rendered in the shared (dashboard) layout, not just /company.
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
