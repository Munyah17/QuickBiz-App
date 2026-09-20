import "server-only";
import { ApiError, type ApiKeyContext } from "./auth";
import { callApiRpc } from "./rpc";

// Per-endpoint token costs. Reads are cheap, writes cost more, heavy
// endpoints (reports, bulk) cost the most. $1 = 1000 tokens.
export const TOKEN_COSTS: Record<string, number> = {
  "GET /v1/products": 2,
  "GET /v1/products/:id": 1,
  "GET /v1/customers": 2,
  "GET /v1/customers/:id": 1,
  "GET /v1/sales": 2,
  "GET /v1/sales/:id": 2,
  "POST /v1/sales": 10,
  "GET /v1/org": 1,
  "GET /v1/modules": 1,
  "GET /v1/b2b/inventory": 3,
  "GET /v1/b2b/finance/summary": 5,
  "POST /v1/b2b/webhooks": 5,
  default: 1,
};

export function tokenCostFor(method: string, path: string): number {
  const key = `${method.toUpperCase()} ${path}`;
  return TOKEN_COSTS[key] ?? TOKEN_COSTS.default!;
}

/**
 * Debit tokens for a request and log usage. Throws ApiError(402) when the
 * wallet can't cover the cost — the request never reaches the handler.
 */
export async function chargeTokens(
  ctx: ApiKeyContext,
  endpoint: string,
  method: string,
  tokens: number,
  statusCode: number
): Promise<bigint> {
  const { data, error } = await callApiRpc<number>("charge_api_tokens", {
    p_api_key_id: ctx.keyId,
    p_developer_id: ctx.developerId,
    p_endpoint: endpoint,
    p_method: method,
    p_tokens: tokens,
    p_status_code: statusCode,
  });
  if (error) throw new ApiError(500, "Metering failed.", "internal");
  const balance = data as unknown as bigint | number;
  if (Number(balance) < 0) {
    throw new ApiError(402, "Insufficient API tokens. Top up your developer wallet.", "insufficient_tokens");
  }

  // Fire-and-forget: insert the <10% / depleted notification if the balance
  // crossed a threshold. Never block or fail the request on this.
  void callApiRpc("check_balance_alerts", { p_developer_id: ctx.developerId }).catch(() => {});

  return BigInt(balance);
}
