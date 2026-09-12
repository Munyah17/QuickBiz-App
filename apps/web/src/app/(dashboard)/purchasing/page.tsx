import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { StatCard } from "@/components/StatCard";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listPurchaseOrders } from "@/services/purchasing";
import { PurchasingTable } from "./PurchasingTable";

export default async function PurchasingPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "purchasing");
  const canManage = permissions.has("purchasing.manage");

  const orders = await listPurchaseOrders(supabase, orgId);

  const totalOrders = orders.length;
  const draftOrders = orders.filter((o) => o.status === "draft").length;
  const receivedOrders = orders.filter((o) => o.status === "received").length;
  const totalValue = orders.reduce((sum, o) => sum + o.total, 0);

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

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={totalOrders.toString()}
          tone="primary"
        />
        <StatCard
          label="Draft"
          value={draftOrders.toString()}
          tone="warning"
        />
        <StatCard
          label="Received"
          value={receivedOrders.toString()}
          tone="success"
        />
        <StatCard
          label="Total Value"
          value={`$${totalValue.toLocaleString()}`}
          tone="info"
        />
      </div>

      <PurchasingTable orders={orders} />
    </div>
  );
}
