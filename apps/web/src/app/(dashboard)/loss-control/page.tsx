import { PageHeader } from "@/components/PageHeader";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listLossControlRecords } from "@/services/lossControl";
import { listWarehouses } from "@/services/warehousing";
import { LossControlClient } from "./LossControlClient";

export default async function LossControlPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "inventory");
  const canManage = permissions.has("inventory.manage");

  let records: Awaited<ReturnType<typeof listLossControlRecords>> = [];
  let warehouses: Awaited<ReturnType<typeof listWarehouses>> = [];
  let products: Array<{ id: string; name: string }> = [];
  let provisionError: string | null = null;
  try {
    [records, warehouses, products] = await Promise.all([
      listLossControlRecords(supabase, orgId),
      listWarehouses(supabase, orgId),
      supabase
        .from("products")
        .select("id, name")
        .eq("org_id", orgId)
        .order("name")
        .limit(500)
        .then((r) => (r.data ?? []) as Array<{ id: string; name: string }>),
    ]);
  } catch (e) {
    provisionError = (e as Error).message;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader module="Inventory" title="Loss Control" />
      <LossControlClient
        records={records}
        warehouses={warehouses}
        products={products}
        canManage={canManage}
        provisionError={provisionError}
      />
    </div>
  );
}
