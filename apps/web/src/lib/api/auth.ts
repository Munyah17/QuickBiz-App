import "server-only";
import { createHash } from "crypto";
import { callApiRpc } from "./rpc";

export const TOKENS_PER_USD = 1000;

export interface ApiKeyContext {
  keyId: string;
  developerId: string;
  /** Set for private (B2B) keys — the org this key is bound to. */
  orgId: string | null;
  scope: "public" | "private";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string
  ) {
    super(message);
  }
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

/**
 * Extract and validate the bearer key. Throws ApiError(401) on any failure —
 * missing header, unknown key, revoked key, or suspended developer.
 */
export async function authenticateApiKey(request: Request): Promise<ApiKeyContext> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing API key. Send 'Authorization: Bearer <key>'.", "missing_key");
  }
  const plaintext = header.slice(7).trim();
  if (!plaintext.startsWith("qb_")) {
    throw new ApiError(401, "Malformed API key.", "malformed_key");
  }

  const { data, error } = await callApiRpc<
    Array<{ id: string; developer_id: string; org_id: string | null; scope: string; status: string; developer_status: string }>
  >("get_api_key_by_hash", { p_key_hash: hashApiKey(plaintext) });
  if (error) throw new ApiError(500, "Key lookup failed.", "internal");
  const key = data?.[0];
  if (!key) throw new ApiError(401, "Invalid API key.", "invalid_key");
  if (key.status !== "active") throw new ApiError(401, "This API key has been revoked.", "key_revoked");
  if (key.developer_status !== "active") {
    throw new ApiError(403, "This developer account is suspended.", "developer_suspended");
  }

  return {
    keyId: key.id,
    developerId: key.developer_id,
    orgId: key.org_id,
    scope: key.scope as "public" | "private",
  };
}

/**
 * Resolve which org a request targets.
 * - Private keys: always their bound org.
 * - Public keys: the `x-org-id` header, validated against the developer's
 *   licensed orgs (orgs that bought one of their modules).
 */
export async function resolveOrgContext(ctx: ApiKeyContext, request: Request): Promise<string> {
  if (ctx.scope === "private") {
    if (!ctx.orgId) throw new ApiError(403, "Private key has no bound org.", "no_org");
    return ctx.orgId;
  }

  const orgId = request.headers.get("x-org-id");
  if (!orgId) {
    throw new ApiError(400, "Public keys must send the target org as 'x-org-id'.", "missing_org");
  }

  const { data, error } = await callApiRpc<Array<{ org_id: string; org_name: string; module_key: string }>>(
    "developer_licensed_orgs",
    { p_developer_id: ctx.developerId }
  );
  if (error) throw new ApiError(500, "License lookup failed.", "internal");
  const licensed = (data ?? []).some((row) => row.org_id === orgId);
  if (!licensed) {
    throw new ApiError(403, "Your modules are not licensed by this organization.", "org_not_licensed");
  }
  return orgId;
}
