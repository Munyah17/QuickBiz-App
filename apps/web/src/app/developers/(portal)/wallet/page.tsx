import { PageHeader } from "@/components/PageHeader";
import { requireDeveloper } from "@/lib/developer-session";
import { getWallet, listWalletTransactions, listPayouts, TOKENS_PER_USD } from "@/services/developers";
import { WalletManager } from "./WalletManager";

export default async function WalletPage() {
  const { supabase, developer } = await requireDeveloper();
  const [wallet, transactions, payouts] = await Promise.all([
    getWallet(supabase, developer.id),
    listWalletTransactions(supabase, developer.id),
    listPayouts(supabase, developer.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Wallet & Billing" />
      <WalletManager wallet={wallet} transactions={transactions} payouts={payouts} tokensPerUsd={TOKENS_PER_USD} />
    </div>
  );
}
