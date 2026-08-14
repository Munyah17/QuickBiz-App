"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { updateOwnProfile } from "@/services/profile";

export interface ProfileActionState {
  error: string | null;
  success: boolean;
}

export const initialProfileActionState: ProfileActionState = { error: null, success: false };

export async function updateProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const { supabase, user } = await requireUser();

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Name is required.", success: false };

  try {
    await updateOwnProfile(supabase, user.id, fullName);
  } catch (err) {
    return { error: (err as Error).message, success: false };
  }

  // full_name is read into every layout's TopBar/UserMenu.
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
