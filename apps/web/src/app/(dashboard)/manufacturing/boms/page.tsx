import { Layers } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listBoms } from "@/services/manufacturing";
import { listProductsWithStock } from "@/services/products";
import { NewBomModal } from "./NewBomModal";

export default async function BomsPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");
  const canManage = permissions.has("manufacturing.manage");

  const [boms, products] = await Promise.all([listBoms(supabase, orgId), listProductsWithStock(supabase, orgId)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader module="Manufacturing" title="Bills of Materials" />
        {canManage && <NewBomModal products={products.filter((p) => p.is_active)} />}
      </div>

      <Card>
        {boms.length === 0 ? (
          <EmptyState icon={Layers} title="No bills of materials yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Finished product</th>
                <th className="px-4 py-2.5">Components</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {boms.map((b) => (
                <tr key={b.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{b.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {b.productName} <span className="text-text-tertiary">({b.productSku})</span>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{b.componentCount}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={b.is_active ? "success" : "neutral"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
