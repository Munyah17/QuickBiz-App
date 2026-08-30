import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { getBom } from "@/services/manufacturing";

function Row({ label, value, bold, indent }: { label: string; value: string; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-border-subtle font-semibold" : ""}`}>
      <span className={`text-sm ${indent ? "pl-4 text-text-secondary" : "text-text-primary"}`}>{label}</span>
      <span className="text-sm text-text-primary">{value}</span>
    </div>
  );
}

export default async function BomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, orgId } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "manufacturing");

  const bom = await getBom(supabase, orgId, id);
  if (!bom) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/manufacturing/boms" className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary">
        <ArrowLeft className="size-4" />
        Bills of Materials
      </Link>

      <div className="flex items-center justify-between">
        <PageHeader module="Manufacturing" title={bom.name} />
        <Badge>Rev {bom.revision}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Recipe" />
          <div className="flex flex-col gap-3 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-text-tertiary">Finished product</p>
                <p className="text-text-primary">
                  {bom.productName} ({bom.productSku})
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Yield per batch</p>
                <p className="text-text-primary">
                  {bom.yieldQuantity} {bom.productUnitOfMeasure}
                </p>
              </div>
            </div>
            {bom.description && (
              <div>
                <p className="text-xs text-text-tertiary">Description</p>
                <p className="text-sm text-text-secondary">{bom.description}</p>
              </div>
            )}

            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-xs font-medium uppercase tracking-wide text-text-tertiary">
                  <th className="py-2">Component</th>
                  <th className="py-2">Qty / unit</th>
                  <th className="py-2">Waste %</th>
                  <th className="py-2">Unit cost</th>
                  <th className="py-2">Line cost</th>
                </tr>
              </thead>
              <tbody>
                {bom.components.map((c) => (
                  <tr key={c.id} className="border-b border-border-subtle last:border-b-0">
                    <td className="py-2">
                      <p className="text-text-primary">{c.componentName}</p>
                      <p className="text-xs text-text-tertiary">
                        {c.componentSku}
                        {c.notes ? ` - ${c.notes}` : ""}
                      </p>
                    </td>
                    <td className="py-2 text-text-secondary">
                      {c.quantityPerUnit} {c.componentUnitOfMeasure}
                    </td>
                    <td className="py-2 text-text-secondary">{c.wastagePercent}%</td>
                    <td className="py-2 text-text-secondary">${c.costPrice.toFixed(2)}</td>
                    <td className="py-2 font-medium text-text-primary">
                      ${(c.quantityPerUnit * (1 + c.wastagePercent / 100) * c.costPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Estimated cost" />
          <div className="flex flex-col divide-y divide-border-subtle px-4 pb-4">
            <Row label="Material cost (incl. waste)" value={`$${bom.materialCost.toFixed(2)}`} />
            <Row label="Labor cost" value={`$${bom.laborCost.toFixed(2)}`} indent />
            <Row label="Overhead cost" value={`$${bom.overheadCost.toFixed(2)}`} indent />
            <Row label="Total batch cost" value={`$${bom.totalBatchCost.toFixed(2)}`} bold />
            <Row label={`Cost per ${bom.productUnitOfMeasure}`} value={`$${bom.estimatedUnitCost.toFixed(2)}`} bold />
          </div>
        </Card>
      </div>

      <p className="text-sm text-text-tertiary">
        Estimated cost is derived from each component&apos;s current cost price plus its wastage allowance, and the
        recipe&apos;s labor/overhead cost, divided across the batch yield. It updates automatically as component
        costs change; it does not reflect actual production variance until a work order is completed.
      </p>
    </div>
  );
}
