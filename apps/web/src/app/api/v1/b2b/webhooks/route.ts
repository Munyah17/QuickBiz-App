import { createHash, randomBytes } from "crypto";
import { createServiceRoleClient } from "@quickbiz/supabase/client-service-role";
import { apiHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/auth";

const VALID_EVENTS = [
  "invoice.created",
  "invoice.paid",
  "payment.received",
  "stock.low",
  "order.created",
] as const;

// GET /api/v1/b2b/webhooks — list the org's registered webhook endpoints.
export const GET = apiHandler(
  { endpoint: "GET /v1/b2b/webhooks", scope: "private" },
  async (_request, ctx) => {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("api_webhooks")
      .select("id, url, events, status, created_at")
      .eq("org_id", ctx.orgId);
    if (error) throw error;
    return { webhooks: data ?? [] };
  }
);

// POST /api/v1/b2b/webhooks — register a webhook endpoint.
// Body: { url, events: ["invoice.created", ...] }
export const POST = apiHandler(
  { endpoint: "POST /v1/b2b/webhooks", scope: "private" },
  async (request, ctx) => {
    const body = (await request.json().catch(() => null)) as { url?: string; events?: string[] } | null;
    if (!body?.url || !/^https:\/\//.test(body.url)) {
      throw new ApiError(400, "url is required and must be https.", "bad_request");
    }
    const events = (body.events ?? []).filter((e) => (VALID_EVENTS as readonly string[]).includes(e));
    if (events.length === 0) {
      throw new ApiError(400, `events must include at least one of: ${VALID_EVENTS.join(", ")}`, "bad_request");
    }

    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("api_webhooks")
      .insert({ org_id: ctx.orgId, api_key_id: ctx.key.keyId, url: body.url, events, secret })
      .select("id, url, events, status")
      .single();
    if (error) throw error;

    // Secret is returned once — callers use it to verify webhook signatures
    // (HMAC-SHA256 of the payload, sent as x-quickbiz-signature).
    return { webhook: data, signing_secret: secret };
  }
);
