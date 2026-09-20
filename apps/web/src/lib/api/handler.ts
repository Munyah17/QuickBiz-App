import "server-only";
import { NextResponse } from "next/server";
import { authenticateApiKey, resolveOrgContext, ApiError, type ApiKeyContext } from "./auth";
import { chargeTokens, tokenCostFor } from "./meter";

export interface ApiRequestContext {
  key: ApiKeyContext;
  /** Resolved org the request targets (private key's org, or licensed org). */
  orgId: string;
}

interface HandlerOptions {
  /** Endpoint key for metering, e.g. "GET /v1/products". */
  endpoint: string;
  /** Whether this endpoint needs an org context. Default true. */
  needsOrg?: boolean;
  /** Restrict to a key scope. Private (B2B) endpoints set 'private'. */
  scope?: "public" | "private";
}

/**
 * Wrap an API route handler with auth, org resolution, metering, and a
 * consistent error envelope. Usage:
 *
 *   export const GET = apiHandler({ endpoint: "GET /v1/products" },
 *     async (req, ctx) => ({ data: ... }));
 */
export function apiHandler(
  options: HandlerOptions,
  handler: (request: Request, ctx: ApiRequestContext) => Promise<unknown>
) {
  return async (request: Request): Promise<NextResponse> => {
    const method = request.method;
    const tokens = tokenCostFor(method, options.endpoint);

    try {
      const key = await authenticateApiKey(request);
      if (options.scope && key.scope !== options.scope) {
        throw new ApiError(403, `This endpoint requires a ${options.scope} API key.`, "wrong_scope");
      }
      const orgId = options.needsOrg === false ? "" : await resolveOrgContext(key, request);

      const body = await handler(request, { key, orgId });

      // Charge after a successful handler — failed requests still cost the
      // minimum so abuse isn't free, but the full cost only applies to work
      // actually done.
      const balance = await chargeTokens(key, options.endpoint, method, tokens, 200);
      return NextResponse.json(
        { data: body },
        {
          status: 200,
          headers: {
            "x-tokens-used": String(tokens),
            "x-token-balance": String(balance),
          },
        }
      );
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message } },
          { status: err.status }
        );
      }
      console.error(`[api] ${options.endpoint} failed:`, err);
      return NextResponse.json(
        { error: { code: "internal", message: "Internal server error." } },
        { status: 500 }
      );
    }
  };
}
