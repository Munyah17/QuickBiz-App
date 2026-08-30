import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listPurchaseOrders } from "@/services/purchasing";
import { PurchasingTable } from "./PurchasingTable";

export default async function PurchasingPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");
  const canManage = permissions.has("purchasing.manage");

  const orders = await listPurchaseOrders(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Purchasing" />
        {canManage && (
          <Link href="/purchasing/new">
            <Button>
              <Plus className="size-4" />
              New Purchase Order
            </Button>
          </Link>
        )}
      </div>

      <PurchasingTable orders={orders} />
    </div>
  );
}
