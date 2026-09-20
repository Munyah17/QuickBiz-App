import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { TOKEN_COSTS } from "@/lib/api/meter";
import { TOKENS_PER_USD } from "@/services/developers";

const ENDPOINTS = [
  { method: "GET", path: "/api/v1/org", desc: "Target org profile — verify key + org pairing", scope: "any" },
  { method: "GET", path: "/api/v1/modules", desc: "Modules enabled on the target org", scope: "any" },
  { method: "GET", path: "/api/v1/products", desc: "Products with stock. Params: q, limit, offset", scope: "any" },
  { method: "GET", path: "/api/v1/customers", desc: "Customers. Params: q, limit, offset", scope: "any" },
  { method: "GET", path: "/api/v1/sales", desc: "Invoices/quotes. Params: status, doc_type, limit, offset", scope: "any" },
  { method: "POST", path: "/api/v1/sales", desc: "Create a draft invoice. Body: { customer_id?, items[], notes?, due_date? }", scope: "any" },
  { method: "GET", path: "/api/v1/b2b/inventory", desc: "Stock levels across warehouses. Params: warehouse_id", scope: "private" },
  { method: "GET", path: "/api/v1/b2b/finance/summary", desc: "Revenue, receivables, expense totals", scope: "private" },
  { method: "GET", path: "/api/v1/b2b/webhooks", desc: "List registered webhook endpoints", scope: "private" },
  { method: "POST", path: "/api/v1/b2b/webhooks", desc: "Register a webhook. Body: { url, events[] }", scope: "private" },
];

export default function ApiDocsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader title="API Documentation" />

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Authentication</h3>
        <p className="text-sm text-text-secondary">
          Send your key as a bearer token on every request:
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-workspace p-3 font-mono text-xs text-text-secondary">
{`Authorization: Bearer qb_pk_xxxxxxxx

# Public keys also need the target org:
x-org-id: <org-uuid>`}
        </pre>
        <p className="mt-2 text-xs text-text-tertiary">
          Public keys (qb_pk_…) can only access orgs that hold an active license for one of your approved modules.
          Private keys (qb_sk_…) are bound to your own organization.
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Billing</h3>
        <p className="text-sm text-text-secondary">
          API usage is prepaid: $1 = {TOKENS_PER_USD.toLocaleString()} tokens, deducted per call. Responses include{" "}
          <code className="rounded bg-workspace px-1">x-tokens-used</code> and{" "}
          <code className="rounded bg-workspace px-1">x-token-balance</code> headers. A 402 response means your
          wallet is empty — top up in Wallet &amp; Billing.
        </p>
        <div className="mt-3 flex flex-col gap-1">
          {Object.entries(TOKEN_COSTS)
            .filter(([k]) => k !== "default")
            .map(([endpoint, cost]) => (
              <div key={endpoint} className="flex justify-between font-mono text-xs text-text-secondary">
                <span>{endpoint}</span>
                <span>{cost} tok</span>
              </div>
            ))}
          <div className="flex justify-between font-mono text-xs text-text-tertiary">
            <span>any other endpoint</span>
            <span>{TOKEN_COSTS.default} tok</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Endpoints</h3>
        <div className="flex flex-col gap-2">
          {ENDPOINTS.map((e) => (
            <div key={`${e.method} ${e.path}`} className="flex items-start gap-3">
              <span
                className={`w-12 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold ${
                  e.method === "GET" ? "bg-primary-50 text-primary-700" : "bg-success-50 text-success-700"
                }`}
              >
                {e.method}
              </span>
              <div className="min-w-0">
                <code className="text-xs font-medium text-text-primary">{e.path}</code>
                <p className="text-xs text-text-tertiary">
                  {e.desc}
                  {e.scope === "private" && <span className="ml-1 font-medium text-warning-600">(private key only)</span>}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 text-sm font-semibold text-text-primary">Errors</h3>
        <pre className="overflow-x-auto rounded bg-workspace p-3 font-mono text-xs text-text-secondary">
{`{ "error": { "code": "invalid_key", "message": "Invalid API key." } }`}
        </pre>
        <p className="mt-2 text-xs text-text-tertiary">
          Codes: missing_key, malformed_key, invalid_key, key_revoked, developer_suspended, missing_org,
          org_not_licensed, wrong_scope, insufficient_tokens, bad_request, internal.
        </p>
      </Card>
    </div>
  );
}
