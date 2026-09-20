"use client";

import { useActionState } from "react";
import { Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input, Select } from "@/components/Input";
import { initiateTopup, completeTopup, initialDevActionState } from "../../actions";
import type { WalletSummary, WalletTxRow, PayoutRow } from "@/services/developers";

const TYPE_LABEL: Record<WalletTxRow["type"], string> = {
  topup: "Top-up",
  debit: "API usage",
  hosting_fee: "Module hosting",
  refund: "Refund",
};

export function WalletManager({
  wallet,
  transactions,
  payouts,
  tokensPerUsd,
}: {
  wallet: WalletSummary;
  transactions: WalletTxRow[];
  payouts: PayoutRow[];
  tokensPerUsd: number;
}) {
  const [state, formAction, isPending] = useActionState(initiateTopup, initialDevActionState);
  const lowBalance = wallet.lastTopupTokens > 0 && wallet.tokenBalance < wallet.lastTopupTokens * 0.1;

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Balance</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{wallet.tokenBalance.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">tokens</p>
          {lowBalance && <p className="mt-1 text-xs font-medium text-warning-600">Below 10% of last top-up</p>}
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Purchased</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{wallet.lifetimePurchased.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">lifetime tokens</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-text-tertiary">Used</p>
          <p className="mt-1 text-2xl font-semibold text-text-primary">{wallet.lifetimeUsed.toLocaleString()}</p>
          <p className="text-xs text-text-tertiary">lifetime tokens</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Top up</h3>
        <p className="mb-3 text-xs text-text-tertiary">
          ${1} = {tokensPerUsd.toLocaleString()} tokens. Pay with Paynow (card/bank) or EcoCash.
        </p>
        <form action={formAction} className="flex items-end gap-2">
          <div className="w-32">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Amount (USD)</label>
            <Input name="amountUsd" type="number" min="1" step="0.01" defaultValue="10" required />
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-text-secondary">Method</label>
            <Select name="method" defaultValue="paynow">
              <option value="paynow">Paynow</option>
              <option value="ecocash">EcoCash</option>
            </Select>
          </div>
          <Button type="submit" loading={isPending}>
            <Wallet className="size-4" />
            Top up
          </Button>
        </form>
        {state.error && <p className="mt-2 text-sm text-danger-600">{state.error}</p>}
        {state.success && (
          <div className="mt-2 flex items-center gap-2">
            <p className="text-sm text-success-600">{state.success}</p>
            {state.topupId && (
              <button
                type="button"
                onClick={() => void completeTopup(state.topupId!)}
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Mark paid (dev)
              </button>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-text-primary">Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-text-tertiary">No transactions yet.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm">
                {t.type === "topup" || t.type === "refund" ? (
                  <ArrowUpCircle className="size-4 shrink-0 text-success-600" />
                ) : (
                  <ArrowDownCircle className="size-4 shrink-0 text-text-tertiary" />
                )}
                <span className="flex-1 text-text-primary">
                  {TYPE_LABEL[t.type]}
                  {t.method ? ` · ${t.method}` : ""}
                  {t.reference ? ` · ${t.reference}` : ""}
                </span>
                <span className="text-text-secondary">
                  {t.tokens !== 0 ? `${t.tokens.toLocaleString()} tok` : `$${t.amountUsd.toFixed(2)}`}
                </span>
                <span
                  className={`text-xs ${
                    t.status === "completed" ? "text-success-600" : t.status === "failed" ? "text-danger-600" : "text-warning-600"
                  }`}
                >
                  {t.status}
                </span>
                <span className="w-20 text-right text-xs text-text-tertiary">
                  {new Date(t.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold text-text-primary">Payouts</h3>
        <p className="mb-3 text-xs text-text-tertiary">
          Module license revenue, settled monthly. QuickBiz retains 30%; you receive 70%.
        </p>
        {payouts.length === 0 ? (
          <p className="text-sm text-text-tertiary">No payouts yet — they appear once a licensed module bills.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {payouts.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-text-primary">{p.period}</span>
                <span className="text-text-secondary">gross ${p.grossUsd.toFixed(2)}</span>
                <span className="text-text-tertiary">platform ${p.platformShareUsd.toFixed(2)}</span>
                <span className="font-medium text-text-primary">net ${p.netUsd.toFixed(2)}</span>
                <span className={`text-xs ${p.status === "paid" ? "text-success-600" : "text-warning-600"}`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
