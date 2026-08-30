import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { requireOrgContext, requireModuleEnabled } from "@/lib/session";
import { listInvoices } from "@/services/sales";
import { SalesTable } from "./SalesTable";

export default async function SalesPage() {
  const { supabase, orgId, permissions } = await requireOrgContext();
  await requireModuleEnabled(supabase, orgId, "sales");
  const canManage = permissions.has("sales.manage");

  const invoices = await listInvoices(supabase, orgId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Sales" />
        {canManage && (
          <Link href="/sales/new">
            <Button>
              <Plus className="size-4" />
              New Invoice
            </Button>
          </Link>
        )}
      </div>

      <SalesTable invoices={invoices} />
    </div>
  );
}
