// One-off staff-account bootstrapper.
//
// Creates (or overrides) Supabase Auth users, writes their profiles, assigns a
// platform-staff role (platform_staff), and optionally joins them to an org as
// owner/admin so they can also use the ERP dashboard.
//
// Run from apps/web (so @supabase/supabase-js resolves):
//   node scripts/create-staff-accounts.mjs
//   node scripts/create-staff-accounts.mjs --org <org-uuid>   // join a specific org
//   node scripts/create-staff-accounts.mjs --no-org           // platform staff only
//
// Uses NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from apps/web/.env.local
// (or the environment). The service-role key bypasses RLS — keep it server-side.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));

// --- env -------------------------------------------------------------------
function loadEnv() {
  const candidates = [join(__dir, "../.env.local"), join(__dir, "../../.env.local"), join(__dir, "../.env")];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

// --- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const noOrg = args.includes("--no-org");
const orgFlagIdx = args.indexOf("--org");
const explicitOrgId = orgFlagIdx !== -1 ? args[orgFlagIdx + 1] : null;

// --- accounts ----------------------------------------------------------------
const ACCOUNTS = [
  {
    fullName: "Munyah Griezmann",
    username: "Munyah",
    email: "munyamuzvidziwa19@gmail.com",
    password: "@@Griezmann177#$",
    platformRole: "super_admin",
    orgRole: "owner",
  },
  {
    fullName: "Munyah Griezmann09",
    username: "Munyah09",
    email: "munyah777@gmail.com",
    password: "@@Griezmann177#$",
    platformRole: "admin",
    orgRole: "admin",
  },
];

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- helpers -----------------------------------------------------------------
async function findUserByEmail(email) {
  // Paginate admin listUsers; match case-insensitively.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = (data?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (!data || (data.users ?? []).length < 200) return null;
    page += 1;
  }
}

async function upsertAuthUser({ email, password, fullName, username }) {
  const existing = await findUserByEmail(email);
  const metadata = { full_name: fullName, username };
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata ?? {}), ...metadata },
    });
    if (error) throw error;
    return { id: existing.id, mode: "updated" };
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  return { id: data.user.id, mode: "created" };
}

async function upsertProfile(userId, fullName) {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: fullName, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function assignPlatformRole(userId, roleKey) {
  // platform_staff.user_id is unique — upsert keeps it idempotent.
  const { error } = await admin
    .from("platform_staff")
    .upsert({ user_id: userId, role_key: roleKey, status: "active", updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function resolveOrgId() {
  if (explicitOrgId) return explicitOrgId;
  const { data, error } = await admin.from("organizations").select("id, name").order("created_at", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return null;
  if (data.length > 1) console.warn(`  ! multiple orgs found; joining the first ("${data[0].name}"). Pass --org <id> to target a specific one.`);
  return data[0].id;
}

async function joinOrg(userId, orgId, orgRoleKey) {
  // Org member row (head-office branch if one exists).
  const { data: branch } = await admin
    .from("branches").select("id").eq("org_id", orgId).order("created_at", { ascending: true }).limit(1).maybeSingle();
  const { data: member, error: mErr } = await admin
    .from("org_members")
    .upsert({ org_id: orgId, user_id: userId, branch_id: branch?.id ?? null, status: "active" }, { onConflict: "org_id,user_id" })
    .select("id")
    .single();
  if (mErr) throw mErr;

  const { data: role, error: rErr } = await admin
    .from("roles").select("id").eq("org_id", orgId).eq("key", orgRoleKey).maybeSingle();
  if (rErr) throw rErr;
  if (!role) {
    console.warn(`  ! org has no '${orgRoleKey}' role — membership created but no role assigned.`);
    return;
  }
  await admin.from("user_roles").delete().eq("org_member_id", member.id);
  const { error: urErr } = await admin.from("user_roles").insert({ org_member_id: member.id, role_id: role.id });
  if (urErr) throw urErr;
}

// --- run ----------------------------------------------------------------------
(async () => {
  console.log(`Target: ${SUPABASE_URL}`);
  const orgId = noOrg ? null : await resolveOrgId().catch((e) => { console.warn("  ! could not resolve org:", e.message); return null; });
  if (orgId) console.log(`Org membership target: ${orgId}`);
  else if (!noOrg) console.log("No org found — platform-staff accounts only.");

  for (const acct of ACCOUNTS) {
    console.log(`\n→ ${acct.email} (${acct.fullName})`);
    try {
      const { id, mode } = await upsertAuthUser(acct);
      console.log(`  auth user ${mode}: ${id}`);
      await upsertProfile(id, acct.fullName);
      console.log(`  profile: full_name="${acct.fullName}", username="${acct.username}" (user_metadata)`);
      await assignPlatformRole(id, acct.platformRole);
      console.log(`  platform_staff: role_key="${acct.platformRole}"`);
      if (orgId) {
        await joinOrg(id, orgId, acct.orgRole);
        console.log(`  org member: role="${acct.orgRole}"`);
      }
      console.log("  ✓ done");
    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message ?? e}`);
    }
  }
  console.log("\nFinished.");
})();
