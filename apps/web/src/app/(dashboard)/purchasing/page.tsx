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
  await requireModuleEnabled(supabase, orgId, "sales");
  const canManage = permissions.has("purchasing.manage");

  const orders = await listPurchaseOrders(supabase, orgId);

  const today = new Date().toISOString().slice(0, 10);
  const isLate = (o: (typeof orders)[number]) =>
    o.status === "issued" && o.expected_date !== null && o.expected_date < today;

  const totalOrders = orders.length;
  const awaitingReceipt = orders.filter((o) => o.status === "issued");
  const lateOrders = orders.filter(isLate);
  const unpaidBalance = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "draft")
    .reduce((sum, o) => sum + (o.total - o.amount_paid), 0);

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

      {/* Statistics Cards — each drills into the matching table filter */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/purchasing?status=all" className="transition-opacity hover:opacity-80">
          <StatCard
            label="Total orders"
            value={totalOrders.toString()}
            tone="primary"
          />
        </Link>
        <Link href="/purchasing?status=issued" className="transition-opacity hover:opacity-80">
          <StatCard
            label="Awaiting receipt"
            value={awaitingReceipt.length.toString()}
            delta={awaitingReceipt.length > 0 ? { label: `$${awaitingReceipt.reduce((s, o) => s + o.total, 0).toLocaleString()} on order`, direction: "flat" } : undefined}
            tone="info"
          />
        </Link>
        <Link href="/purchasing?status=late" className="transition-opacity hover:opacity-80">
          <StatCard
            label="Late deliveries"
            value={lateOrders.length.toString()}
            tone={lateOrders.length > 0 ? "warning" : "success"}
          />
        </Link>
        <Link href="/purchasing?status=received" className="transition-opacity hover:opacity-80">
          <StatCard
            label="Unpaid to suppliers"
            value={`$${unpaidBalance.toLocaleString()}`}
            tone={unpaidBalance > 0 ? "warning" : "success"}
          />
        </Link>
      </div>

      <PurchasingTable orders={orders} />
    </div>
  );
}
